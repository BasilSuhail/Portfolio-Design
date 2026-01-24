import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded photos from client/public/uploads (persistent storage)
  const uploadsPath = path.resolve(process.cwd(), "client", "public", "uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use('/uploads', express.static(uploadsPath, {
      maxAge: '1w',
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    }));
  }

  // Serve gallery images from gallery-data directory (Docker volume mount)
  // Uses GALLERY_DATA_DIR env var if set, otherwise defaults to ./gallery-data
  const galleryDataPath = process.env.GALLERY_DATA_DIR || path.resolve(process.cwd(), "gallery-data");
  if (fs.existsSync(galleryDataPath)) {
    app.use('/gallery-images', express.static(galleryDataPath, {
      maxAge: '1w',
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    }));
    console.log(`[Static] Serving gallery images from: ${galleryDataPath}`);
  }

  // Serve static files with aggressive caching
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for 1 year
    immutable: true,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // HTML files should not be cached aggressively
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      // JavaScript and CSS with hashed names can be cached forever
      else if (filePath.match(/\.(js|css)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Images can be cached for a moderate time
      else if (filePath.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
