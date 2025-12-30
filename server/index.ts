import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import createMemoryStore from "memorystore";

const app = express();
const httpServer = createServer(app);

// Trust proxy - REQUIRED for Cloudflare/reverse proxies
// This allows Express to trust X-Forwarded-* headers
// Build: 2025-12-17-force-rebuild
app.set('trust proxy', 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security middleware - helmet adds various HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (can enable later with proper config)
  crossOriginEmbedderPolicy: false,
}));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// Session middleware - required for CSRF protection
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

// Use MemoryStore for session persistence in production
const MemoryStore = createMemoryStore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // prune expired entries every 24h
});

app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true, // Changed to true - must save session even if uninitialized for CSRF to work
  name: 'sessionId', // Custom name to avoid conflicts
  proxy: true, // Trust the reverse proxy
  rolling: true, // Reset cookie expiry on every request
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax", // Changed from "strict" to "lax" for better compatibility with proxies
    path: '/', // Explicitly set cookie path
    domain: undefined, // Let the browser determine the domain
  },
}));

// CSRF protection middleware
const csrfProtection = doubleCsrf({
  getSecret: () => sessionSecret,
  getSessionIdentifier: (req) => {
    // Use the session ID from express-session
    // sessionID is automatically generated and persisted by express-session
    const sessionId = req.sessionID || "";
    if (!sessionId) {
      log(`WARNING: No session ID found for request to ${req.path}`);
    }
    return sessionId;
  },
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from "strict" to "lax" for better compatibility with proxies
    path: '/', // Explicitly set cookie path
    domain: undefined, // Let the browser determine the domain
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

const { generateCsrfToken, doubleCsrfProtection } = csrfProtection;

// Endpoint to get CSRF token for frontend
app.get("/api/csrf-token", (req, res) => {
  try {
    // Force session save before generating token
    req.session.save((err) => {
      if (err) {
        log(`Session save error: ${err}`);
        return res.status(500).json({ message: "Failed to save session" });
      }

      const token = generateCsrfToken(req, res);
      log(`CSRF token generated | Session: ${req.sessionID?.substring(0, 8)}... | IP: ${req.ip}`);
      res.json({ token });
    });
  } catch (error) {
    log(`Failed to generate CSRF token: ${error}`);
    res.status(500).json({ message: "Failed to generate CSRF token" });
  }
});

// Middleware to debug CSRF issues on admin routes
const debugCsrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/admin')) {
    log(`Admin request | Method: ${req.method} | Path: ${req.path} | Session: ${req.sessionID?.substring(0, 8)}... | Has CSRF header: ${!!req.headers['x-csrf-token']} | Has CSRF cookie: ${!!req.cookies['x-csrf-token']} | IP: ${req.ip}`);
  }
  next();
};

app.use(debugCsrfMiddleware);

// Export CSRF protection for use in routes
export { doubleCsrfProtection };

// Rate limiting - prevent brute force and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for admin/write operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 requests per 15 minutes for admin operations
  message: { message: "Too many admin requests, please slow down" },
});

app.use("/api/admin", strictLimiter);
app.use("/api/contact", strictLimiter);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "10mb", // Limit request body size
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Add X-Robots-Tag header for SEO
app.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Enhanced error handler with CSRF-specific handling
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log CSRF errors with more context
    if (err.code === "EBADCSRFTOKEN" || message.toLowerCase().includes("csrf")) {
      log(`CSRF Error: ${message} | Method: ${req.method} | Path: ${req.path} | Session: ${req.sessionID?.substring(0, 8)}... | IP: ${req.ip}`);
    } else if (status >= 400) {
      log(`Error ${status}: ${message} | Method: ${req.method} | Path: ${req.path}`);
    }

    res.status(status).json({ message });

    // Only throw in development for better error visibility
    if (process.env.NODE_ENV !== "production") {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Start auto-refresh news service
  if (process.env.NODE_ENV === "production") {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execPromise = promisify(exec);

    // Check every minute if it's noon to refresh news
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 12 && now.getMinutes() === 0) {
        log('Auto-refreshing news at noon...');
        try {
          await execPromise('node scrape-news.js');
          log('News auto-refresh completed');
        } catch (error) {
          log(`Failed to auto-refresh news: ${error}`);
        }
      }
    }, 60000); // Check every minute

    log('Auto-refresh news service started (daily at 12:00 PM)');
  }
})();

// Export for Vercel serverless
export default app;
export { registerRoutes } from "./routes";
export { serveStatic } from "./static";
