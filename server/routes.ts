import type { Express, Request, Response } from "express";
import { type Server } from "http";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import convert from "heic-convert";
import { Resend } from "resend";
import * as blogService from "./blogService";
import * as newsService from "./newsService";
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
// In production AND dev, uploads go to client/public/uploads (persistent storage)
// This ensures uploads survive rebuilds
const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Directory is created at startup, just use it
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for images (increased from 5MB)
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic/;
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
      body('content').optional(), // Content is optional for PDF blogs
      body('coverImage').optional().custom((value) => {
        // Allow empty string or valid URL paths (including /uploads/...)
        if (!value || value === '') return true;
        if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) return true;
        throw new Error('Cover image must be a valid URL or path');
      }),
      body('contentType').optional().isIn(['html', 'pdf']),
      body('pdfUrl').optional().custom((value) => {
        // Allow empty string or valid URL paths
        if (!value || value === '') return true;
        if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) return true;
        throw new Error('PDF URL must be a valid URL or path');
      }),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Blog validation errors:", errors.array());
        return res.status(400).json({ message: "Invalid input", errors: errors.array() });
      }

      try {
        // Sanitize inputs
        const sanitizedData: any = {
          ...req.body,
          title: sanitizeText(req.body.title),
          slug: sanitizeText(req.body.slug),
          excerpt: req.body.excerpt ? sanitizeText(req.body.excerpt) : undefined,
          contentType: req.body.contentType || 'html',
        };

        // Only sanitize HTML content if it's an HTML blog
        if (req.body.contentType === 'pdf') {
          // For PDF blogs, use content as-is or set a default
          sanitizedData.content = req.body.content || `PDF Document: ${req.body.title}`;
          sanitizedData.pdfUrl = req.body.pdfUrl;
        } else {
          // For HTML blogs, sanitize the HTML content
          sanitizedData.content = req.body.content ? sanitizeHTML(req.body.content) : '';
        }

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
      body('coverImage').optional().custom((value) => {
        if (!value || value === '') return true;
        if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) return true;
        throw new Error('Cover image must be a valid URL or path');
      }),
      body('contentType').optional().isIn(['html', 'pdf']),
      body('pdfUrl').optional().custom((value) => {
        if (!value || value === '') return true;
        if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) return true;
        throw new Error('PDF URL must be a valid URL or path');
      }),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Blog update validation errors:", errors.array());
        return res.status(400).json({ message: "Invalid input", errors: errors.array() });
      }

      try {
        // Sanitize inputs
        const sanitizedData: any = { ...req.body };
        if (req.body.title) sanitizedData.title = sanitizeText(req.body.title);
        if (req.body.slug) sanitizedData.slug = sanitizeText(req.body.slug);
        if (req.body.excerpt) sanitizedData.excerpt = sanitizeText(req.body.excerpt);

        // Handle content based on type
        if (req.body.contentType === 'pdf') {
          // For PDF blogs, keep content minimal
          if (req.body.content) sanitizedData.content = req.body.content;
          if (req.body.pdfUrl) sanitizedData.pdfUrl = req.body.pdfUrl;
        } else if (req.body.content) {
          // For HTML blogs, sanitize HTML content
          sanitizedData.content = sanitizeHTML(req.body.content);
        }

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

  // News API endpoints
  const newsDataPath = path.join(process.cwd(), "news_feed.json");
  const newsSettingsPath = path.join(process.cwd(), "news_settings.json");

  // Get news feed
  app.get("/api/news", async (_req: Request, res: Response) => {
    try {
      // Read news data
      let newsData = [];
      try {
        const newsContent = await fs.readFile(newsDataPath, "utf-8");
        newsData = JSON.parse(newsContent);
      } catch (err) {
        // If file doesn't exist, return empty array
        newsData = [];
      }

      // Read settings
      let settings = { visible: true };
      try {
        const settingsContent = await fs.readFile(newsSettingsPath, "utf-8");
        settings = JSON.parse(settingsContent);
      } catch (err) {
        // Default to visible if settings don't exist
        settings = { visible: true };
      }

      res.json({ news: newsData, visible: settings.visible });
    } catch (error) {
      console.error("Failed to fetch news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Get single news by date
  app.get("/api/news/:date", async (req: Request, res: Response) => {
    try {
      const newsContent = await fs.readFile(newsDataPath, "utf-8");
      const newsData = JSON.parse(newsContent);

      const newsDay = newsData.find((item: any) => item.date === req.params.date);

      if (!newsDay) {
        return res.status(404).json({ message: "News not found" });
      }

      res.json(newsDay);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Refresh news feed - syncs missing days from the last 8 days
  app.post("/api/news/refresh", async (_req: Request, res: Response) => {
    try {
      console.log("Starting news sync...");
      const result = await newsService.refreshNewsFeed();
      console.log("News sync completed:", result);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to refresh news:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to refresh news"
      });
    }
  });

  // ========================================
  // MARKET INTELLIGENCE / TERMINAL ROUTES
  // ========================================

  // Get Market Terminal data (analyses, sentiment history, trends)
  app.get("/api/market-terminal", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const data = await newsService.getMarketTerminalData(Math.min(days, 30));
      res.json(data);
    } catch (error: any) {
      console.error("Failed to fetch market terminal data:", error);
      res.status(500).json({ message: "Failed to fetch market terminal data" });
    }
  });

  // Get latest market intelligence (single day analysis)
  app.get("/api/market-terminal/latest", async (_req: Request, res: Response) => {
    try {
      const data = await newsService.getLatestMarketIntelligence();
      res.json(data);
    } catch (error: any) {
      console.error("Failed to fetch latest market intelligence:", error);
      res.status(500).json({ message: "Failed to fetch latest market intelligence" });
    }
  });

  // Get sentiment history for charts
  app.get("/api/market-terminal/sentiment", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const sentimentHistory = await newsService.getSentimentHistory(Math.min(days, 90));
      res.json({ sentimentHistory });
    } catch (error: any) {
      console.error("Failed to fetch sentiment history:", error);
      res.status(500).json({ message: "Failed to fetch sentiment history" });
    }
  });

  // Get historical analyses
  app.get("/api/market-terminal/history", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const analyses = await newsService.getHistoricalAnalysis(Math.min(days, 30));
      res.json({ analyses });
    } catch (error: any) {
      console.error("Failed to fetch historical analyses:", error);
      res.status(500).json({ message: "Failed to fetch historical analyses" });
    }
  });

  // Update news settings (admin)
  app.post("/api/admin/news/settings", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      const { visible } = req.body;
      const settings = { visible: visible !== false };

      await fs.writeFile(newsSettingsPath, JSON.stringify(settings, null, 2));
      res.json({ message: "News settings updated successfully", settings });
    } catch (error) {
      console.error("Failed to update news settings:", error);
      res.status(500).json({ message: "Failed to update news settings" });
    }
  });

  // Get news settings (admin)
  app.get("/api/admin/news/settings", async (_req: Request, res: Response) => {
    try {
      let settings = { visible: true };
      try {
        const settingsContent = await fs.readFile(newsSettingsPath, "utf-8");
        settings = JSON.parse(settingsContent);
      } catch (err) {
        settings = { visible: true };
      }

      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch news settings:", error);
      res.status(500).json({ message: "Failed to fetch news settings" });
    }
  });

  // Gallery API endpoints
  const galleryDataPath = path.join(process.cwd(), "gallery.json");
  const gallerySettingsPath = path.join(process.cwd(), "gallery_settings.json");

  // Get gallery
  app.get("/api/gallery", async (_req: Request, res: Response) => {
    try {
      // Read gallery data
      let photos = [];
      try {
        const galleryContent = await fs.readFile(galleryDataPath, "utf-8");
        photos = JSON.parse(galleryContent);
      } catch (err) {
        photos = [];
      }

      // Sort photos by ID descending (newest first)
      photos.sort((a: any, b: any) => b.id - a.id);

      // Read settings
      let settings = { visible: true };
      try {
        const settingsContent = await fs.readFile(gallerySettingsPath, "utf-8");
        settings = JSON.parse(settingsContent);
      } catch (err) {
        settings = { visible: true };
      }

      res.json({ photos, visible: settings.visible });
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Get gallery settings (admin)
  app.get("/api/admin/gallery/settings", async (_req: Request, res: Response) => {
    try {
      let settings = { visible: true };
      try {
        const settingsContent = await fs.readFile(gallerySettingsPath, "utf-8");
        settings = JSON.parse(settingsContent);
      } catch (err) {
        settings = { visible: true };
      }

      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch gallery settings:", error);
      res.status(500).json({ message: "Failed to fetch gallery settings" });
    }
  });

  // Update gallery settings (admin)
  app.post("/api/admin/gallery/settings", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      const { visible } = req.body;
      const settings = { visible: visible !== false };

      await fs.writeFile(gallerySettingsPath, JSON.stringify(settings, null, 2));
      res.json({ message: "Gallery settings updated successfully", settings });
    } catch (error) {
      console.error("Failed to update gallery settings:", error);
      res.status(500).json({ message: "Failed to update gallery settings" });
    }
  });

  // Get all photos (admin)
  app.get("/api/admin/gallery", async (_req: Request, res: Response) => {
    try {
      let photos = [];
      try {
        const galleryContent = await fs.readFile(galleryDataPath, "utf-8");
        photos = JSON.parse(galleryContent);
      } catch (err) {
        photos = [];
      }

      // Sort photos by ID descending (newest first)
      photos.sort((a: any, b: any) => b.id - a.id);

      res.json(photos);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Bulk upload photos (admin) - NEW endpoint for multiple files
  app.post("/api/admin/gallery/bulk-upload", doubleCsrfProtection, upload.array("photos", 100), async (req: Request, res: Response) => {
    try {
      console.log("📸 Bulk upload request received");
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        console.error("❌ No files in request");
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log(`📦 Processing ${files.length} files`);

      // Parse metadata from request body
      const metadata = JSON.parse(req.body.metadata || "[]");

      // Read existing gallery
      let photos = [];
      try {
        const galleryContent = await fs.readFile(galleryDataPath, "utf-8");
        photos = JSON.parse(galleryContent);
      } catch (err) {
        photos = [];
      }

      // Process all files in parallel for faster HEIC conversion
      const processFile = async (file: Express.Multer.File, index: number) => {
        const meta = metadata[index] || {};

        try {
          let finalFilename = file.filename;
          const originalPath = file.path;
          const ext = path.extname(file.originalname).toLowerCase();

          // Convert HEIC to JPEG
          if (ext === '.heic' || ext === '.heif') {
            const jpegFilename = finalFilename.replace(/\.(heic|heif)$/i, '.jpg');
            const jpegPath = path.join(uploadsDir, jpegFilename);

            try {
              const inputBuffer = await fs.readFile(originalPath);
              const outputBuffer = await convert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 0.9
              });

              await fs.writeFile(jpegPath, outputBuffer);
              await fs.unlink(originalPath);
              finalFilename = jpegFilename;
            } catch (conversionError) {
              console.error(`⚠️ HEIC conversion failed for ${file.originalname}, using original`);
            }
          }

          // Create photo entry
          const newPhoto = {
            id: Date.now() + index, // Add index to ensure unique IDs
            src: `/uploads/${finalFilename}`,
            alt: sanitizeText(meta.alt || ""),
            location: sanitizeText(meta.location || ""),
            date: sanitizeText(meta.date || ""),
            orientation: meta.orientation || "landscape"
          };

          return { success: true, photo: newPhoto, filename: file.originalname };
        } catch (err) {
          console.error(`❌ Failed to process ${file.originalname}:`, err);
          return { success: false, filename: file.originalname, error: String(err) };
        }
      };

      // Process all files in parallel
      const processResults = await Promise.all(
        files.map((file, index) => processFile(file, index))
      );

      // Collect results
      let successCount = 0;
      let failCount = 0;
      const results = [];

      for (const result of processResults) {
        if (result.success) {
          photos.push(result.photo);
          successCount++;
          results.push({ success: true, filename: result.filename });
        } else {
          failCount++;
          results.push({ success: false, filename: result.filename, error: result.error });
        }
      }

      // Save all photos at once
      await fs.writeFile(galleryDataPath, JSON.stringify(photos, null, 2));
      console.log(`💾 Saved ${successCount} photos to gallery.json`);

      res.json({
        message: `Uploaded ${successCount} of ${files.length} photos`,
        successCount,
        failCount,
        results
      });
    } catch (error) {
      console.error("❌ Bulk upload failed:", error);
      res.status(500).json({ message: "Bulk upload failed", error: String(error) });
    }
  });

  // Upload single photo (admin) - kept for backwards compatibility
  app.post("/api/admin/gallery/upload", doubleCsrfProtection, upload.single("photo"), async (req: Request, res: Response) => {
    try {
      console.log("📸 Gallery upload request received");
      console.log("File:", req.file);
      console.log("Body:", req.body);

      if (!req.file) {
        console.error("❌ No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { alt, location, date, orientation } = req.body;

      let finalFilename = req.file.filename;
      const originalPath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      // Convert HEIC to JPEG
      if (ext === '.heic' || ext === '.heif') {
        console.log("🔄 Converting HEIC to JPEG...");
        const jpegFilename = finalFilename.replace(/\.(heic|heif)$/i, '.jpg');
        const jpegPath = path.join(uploadsDir, jpegFilename);

        try {
          const inputBuffer = await fs.readFile(originalPath);
          const outputBuffer = await convert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: 0.9
          });

          await fs.writeFile(jpegPath, outputBuffer);
          await fs.unlink(originalPath);
          finalFilename = jpegFilename;
          console.log("✅ Converted to JPEG:", jpegFilename);
        } catch (conversionError) {
          console.error("❌ HEIC conversion failed:", conversionError);
          // Continue with original file if conversion fails
        }
      }

      // Read existing gallery
      let photos = [];
      try {
        const galleryContent = await fs.readFile(galleryDataPath, "utf-8");
        photos = JSON.parse(galleryContent);
        console.log("📚 Existing photos count:", photos.length);
      } catch (err) {
        console.log("📚 No existing gallery, starting fresh");
        photos = [];
      }

      // Create new photo entry
      const newPhoto = {
        id: Date.now(),
        src: `/uploads/${finalFilename}`,
        alt: sanitizeText(alt || ""),
        location: sanitizeText(location || ""),
        date: sanitizeText(date || ""),
        orientation: orientation || "landscape"
      };

      photos.push(newPhoto);
      console.log("✅ Adding new photo:", newPhoto);

      // Save to file
      await fs.writeFile(galleryDataPath, JSON.stringify(photos, null, 2));
      console.log("💾 Saved to gallery.json");

      res.json({ message: "Photo uploaded successfully", photo: newPhoto });
    } catch (error) {
      console.error("❌ Failed to upload photo:", error);
      res.status(500).json({ message: "Failed to upload photo", error: String(error) });
    }
  });

  // Delete photo (admin)
  app.delete("/api/admin/gallery/:id", doubleCsrfProtection, async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);

      // Read gallery
      let photos = [];
      try {
        const galleryContent = await fs.readFile(galleryDataPath, "utf-8");
        photos = JSON.parse(galleryContent);
      } catch (err) {
        return res.status(404).json({ message: "Gallery not found" });
      }

      // Find and remove photo
      const photoIndex = photos.findIndex((p: any) => p.id === photoId);
      if (photoIndex === -1) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const photo = photos[photoIndex];

      // Delete image file
      if (photo.src && photo.src.startsWith("/uploads/")) {
        const imagePath = path.join(uploadsDir, path.basename(photo.src));
        try {
          await fs.unlink(imagePath);
        } catch (err) {
          console.error("Failed to delete image file:", err);
        }
      }

      // Remove from array
      photos.splice(photoIndex, 1);

      // Save updated gallery
      await fs.writeFile(galleryDataPath, JSON.stringify(photos, null, 2));

      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Failed to delete photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  return httpServer;
}
