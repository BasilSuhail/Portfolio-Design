import type { Express, Request, Response } from "express";
import { type Server } from "http";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { Resend } from "resend";

// Use process.cwd() instead of import.meta.url for compatibility with CommonJS build
const contentPath = path.join(process.cwd(), "content.json");
const blogsPath = path.join(process.cwd(), "blogs.json");
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
  app.post("/api/content", async (req: Request, res: Response) => {
    try {
      await fs.writeFile(contentPath, JSON.stringify(req.body, null, 2));
      res.json({ message: "Content updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Upload image
  app.post("/api/upload", upload.single("image"), async (req: Request, res: Response) => {
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

  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
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

  // Contact form submission
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Initialize Resend with API key from environment variable
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Send email using Resend
      await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>', // Use Resend's default sender for testing
        to: 'basilsuhail3@gmail.com',
        replyTo: email,
        subject: `Portfolio Contact: Message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });

      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Blog API endpoints

  // Get all blogs (public - only published)
  app.get("/api/blogs", async (_req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      const blogs = JSON.parse(data);
      // Only return published blogs for public view
      const publishedBlogs = blogs.filter((blog: any) => blog.published);
      res.json(publishedBlogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get all blogs (admin - including drafts)
  app.get("/api/admin/blogs", async (_req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      const blogs = JSON.parse(data);
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get single blog by slug
  app.get("/api/blogs/:slug", async (req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      const blogs = JSON.parse(data);
      const blog = blogs.find((b: any) => b.slug === req.params.slug);

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Only allow viewing published blogs publicly
      if (!blog.published) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(blog);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog" });
    }
  });

  // Create blog (admin)
  app.post("/api/admin/blogs", async (req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      const blogs = JSON.parse(data);

      const newBlog = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      blogs.push(newBlog);
      await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));

      res.json(newBlog);
    } catch (error) {
      res.status(500).json({ message: "Failed to create blog" });
    }
  });

  // Update blog (admin)
  app.put("/api/admin/blogs/:id", async (req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      const blogs = JSON.parse(data);

      const index = blogs.findIndex((b: any) => b.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Blog not found" });
      }

      blogs[index] = {
        ...blogs[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));
      res.json(blogs[index]);
    } catch (error) {
      res.status(500).json({ message: "Failed to update blog" });
    }
  });

  // Delete blog (admin)
  app.delete("/api/admin/blogs/:id", async (req: Request, res: Response) => {
    try {
      const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
      let blogs = JSON.parse(data);

      blogs = blogs.filter((b: any) => b.id !== req.params.id);
      await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));

      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog" });
    }
  });

  return httpServer;
}
