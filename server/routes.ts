import type { Express, Request, Response } from "express";
import { type Server } from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentPath = path.join(__dirname, "..", "content.json");
const uploadsDir = path.join(__dirname, "..", "client", "public", "uploads");

// Ensure uploads directory exists
await fs.mkdir(uploadsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
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

  return httpServer;
}
