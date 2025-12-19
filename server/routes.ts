import type { Express, Request, Response } from "express";
import { type Server } from "http";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { Resend } from "resend";
import * as blogService from "./blogService";
import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { doubleCsrfProtection } from "./index";

// Sanitize HTML content - allows safe tags, strips scripts
function sanitizeHTML(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                  'tbody', 'tr', 'th', 'td', 'span', 'div'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'class', 'style'],
      '*': ['class', 'style'],
    },
  });
}

// Sanitize plain text - strips all HTML
function sanitizeText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

// Use process.cwd() instead of import.meta.url for compatibility with CommonJS build
const contentPath = path.join(process.cwd(), "content.json");
const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    // Ensure uploads directory exists when multer needs it
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Separate multer config for PDF uploads
const pdfUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for PDFs
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Ensure uploads directory exists at startup
  await fs.mkdir(uploadsDir, { recursive: true });
  // Get portfolio content
  app.get("/api/content", async (_req: Request, res: Response) => {
    try {
      const content = await fs.readFile(contentPath, "utf-8");
      res.json(JSON.parse(content));
    } catch (error) {
      res.status(500).json({ message: "Failed to read content" });
    }
  });

  // Update portfolio content
  app.post("/api/content", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      await fs.writeFile(contentPath, JSON.stringify(req.body, null, 2));
      res.json({ message: "Content updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Upload image
  app.post("/api/upload", doubleCsrfProtection, upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload PDF
  app.post("/api/upload-pdf", doubleCsrfProtection, pdfUpload.single("pdf"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      const pdfUrl = `/uploads/${req.file.filename}`;
      const fileSize = (req.file.size / (1024 * 1024)).toFixed(2); // Size in MB

      res.json({
        url: pdfUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: fileSize + ' MB'
      });
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ message: "Failed to upload PDF" });
    }
  });

  // Admin login
  app.post("/api/admin/login", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123"; // Default password for development

      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Contact form submission - with validation and sanitization
  app.post(
    "/api/contact",
    doubleCsrfProtection,
    [
      body('name').trim().notEmpty().isLength({ max: 100 }).escape(),
      body('email').trim().notEmpty().isEmail().normalizeEmail(),
      body('message').trim().notEmpty().isLength({ max: 5000 }),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: errors.array() });
      }

      try {
        // Anti-spam validation
        // 1. Honeypot check - reject if honeypot field is filled
        if (req.body._honeypot) {
          console.log(`Spam detected from ${req.ip}: honeypot filled`);
          return res.status(400).json({ message: "Invalid submission" });
        }

        // 2. Time-based check - reject if form submitted too quickly (less than 3 seconds)
        if (req.body._timestamp) {
          const timeTaken = Date.now() - parseInt(req.body._timestamp);
          if (timeTaken < 3000) {
            console.log(`Spam detected from ${req.ip}: submitted too quickly (${timeTaken}ms)`);
            return res.status(400).json({ message: "Form submitted too quickly" });
          }
        }

        // 3. Spam keyword detection
        const spamKeywords = ['viagra', 'crypto', 'bitcoin', 'forex', 'casino', 'prize', 'winner', 'click here', 'buy now', 'limited time'];
        const messageText = req.body.message.toLowerCase();
        const hasSpam = spamKeywords.some(keyword => messageText.includes(keyword));

        if (hasSpam) {
          console.log(`Spam detected from ${req.ip}: contains spam keywords`);
          return res.status(400).json({ message: "Message contains suspicious content" });
        }

        // Sanitize inputs
        const sanitizedName = sanitizeText(req.body.name);
        const sanitizedEmail = sanitizeText(req.body.email);
        const sanitizedMessage = sanitizeText(req.body.message);

        // Initialize Resend with API key from environment variable
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send email using Resend
        await resend.emails.send({
          from: 'Portfolio Contact <onboarding@resend.dev>', // Use Resend's default sender for testing
          to: 'basilsuhail3@gmail.com',
          replyTo: sanitizedEmail,
          subject: `Portfolio Contact: Message from ${sanitizedName}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${sanitizedName}</p>
            <p><strong>Email:</strong> ${sanitizedEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
          `,
        });

        res.json({ message: "Message sent successfully" });
      } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  );

  // Blog API endpoints

  // Get all blogs (public - only published)
  app.get("/api/blogs", async (_req: Request, res: Response) => {
    try {
      const blogs = await blogService.getAllBlogs();
      res.json(blogs);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get all blogs (admin - including drafts)
  app.get("/api/admin/blogs", async (_req: Request, res: Response) => {
    try {
      const blogs = await blogService.getAllBlogsAdmin();
      res.json(blogs);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get single blog by slug
  app.get("/api/blogs/:slug", async (req: Request, res: Response) => {
    try {
      const blog = await blogService.getBlogBySlug(req.params.slug);

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(blog);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      res.status(500).json({ message: "Failed to fetch blog" });
    }
  });

  // Create blog (admin) - with validation and sanitization
  app.post(
    "/api/admin/blogs",
    doubleCsrfProtection,
    [
      body('title').trim().notEmpty().isLength({ max: 200 }).escape(),
      body('slug').trim().notEmpty().isLength({ max: 200 }).matches(/^[a-z0-9-]+$/),
      body('excerpt').optional().trim().isLength({ max: 500 }),
      body('content').notEmpty(),
      body('coverImage').optional().trim().isURL(),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: errors.array() });
      }

      try {
        // Sanitize inputs
        const sanitizedData = {
          ...req.body,
          title: sanitizeText(req.body.title),
          slug: sanitizeText(req.body.slug),
          excerpt: req.body.excerpt ? sanitizeText(req.body.excerpt) : undefined,
          content: sanitizeHTML(req.body.content), // Allow safe HTML in content
        };

        const newBlog = await blogService.createBlog(sanitizedData);
        res.json(newBlog);
      } catch (error) {
        console.error("Failed to create blog:", error);
        res.status(500).json({ message: "Failed to create blog" });
      }
    }
  );

  // Update blog (admin) - with validation and sanitization
  app.put(
    "/api/admin/blogs/:id",
    doubleCsrfProtection,
    [
      body('title').optional().trim().isLength({ max: 200 }).escape(),
      body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
      body('excerpt').optional().trim().isLength({ max: 500 }),
      body('content').optional(),
      body('coverImage').optional().trim().isURL(),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: errors.array() });
      }

      try {
        // Sanitize inputs
        const sanitizedData: any = { ...req.body };
        if (req.body.title) sanitizedData.title = sanitizeText(req.body.title);
        if (req.body.slug) sanitizedData.slug = sanitizeText(req.body.slug);
        if (req.body.excerpt) sanitizedData.excerpt = sanitizeText(req.body.excerpt);
        if (req.body.content) sanitizedData.content = sanitizeHTML(req.body.content);

        const updatedBlog = await blogService.updateBlog(req.params.id, sanitizedData);

        if (!updatedBlog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        res.json(updatedBlog);
      } catch (error) {
        console.error("Failed to update blog:", error);
        res.status(500).json({ message: "Failed to update blog" });
      }
    }
  );

  // Delete blog (admin)
  app.delete("/api/admin/blogs/:id", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      await blogService.deleteBlog(req.params.id);
      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      console.error("Failed to delete blog:", error);
      res.status(500).json({ message: "Failed to delete blog" });
    }
  });

  return httpServer;
}
