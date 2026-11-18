// Server-side sign-in for the admin area. The browser's own "logged in" flag is only a
// convenience for showing the right page; this is what actually decides who may change things.
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// Paths under /api/admin that must stay reachable without being signed in.
const OPEN_ADMIN_PATHS = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/session"]);

// Write endpoints outside /api/admin that only the admin page uses.
const ADMIN_ONLY_WRITES = new Set(["/api/content", "/api/upload", "/api/upload-pdf", "/api/intelligence/run"]);

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function needsAdmin(req: Request): boolean {
  const path = req.path.replace(/\/+$/, "");
  if (path.startsWith("/api/admin/") || path === "/api/admin") return !OPEN_ADMIN_PATHS.has(path);
  return ADMIN_ONLY_WRITES.has(path) && !SAFE_METHODS.has(req.method);
}

/** Turns away anyone who is not signed in from the admin endpoints. Register before the routes. */
export function guardAdminRoutes(req: Request, res: Response, next: NextFunction) {
  if (!needsAdmin(req) || req.session?.isAdmin) return next();
  res.status(401).json({ message: "Sign in to the admin area first" });
}

/** A handful of password attempts per address, then a wait. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in a few minutes." },
});

/** Compares without leaking, through timing, how much of the password was right. */
function samePassword(given: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function login(req: Request, res: Response) {
  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin123");
  if (!expected) {
    // No fallback password on the live site: without one configured, nobody gets in.
    return res.status(503).json({ success: false, message: "Admin sign-in is not configured" });
  }
  const given = typeof req.body?.password === "string" ? req.body.password : "";
  if (!samePassword(given, expected)) {
    return res.status(401).json({ success: false, message: "Invalid password" });
  }
  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) return res.status(500).json({ success: false, message: "Login failed" });
    res.json({ success: true });
  });
}

export function logout(req: Request, res: Response) {
  req.session.isAdmin = false;
  req.session.save(() => res.json({ success: true }));
}

export function sessionStatus(req: Request, res: Response) {
  res.json({ authenticated: !!req.session?.isAdmin });
}
