// Vercel serverless function
const express = require('express');
const { registerRoutes } = require('../dist/index.cjs');
const { serveStatic } = require('../dist/index.cjs');

let app;

async function getApp() {
  if (app) return app;

  app = express();

  app.use(express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use(express.urlencoded({ extended: false }));

  // Register API routes
  await registerRoutes(null, app);

  // Serve static files
  try {
    serveStatic(app);
  } catch (err) {
    console.error('Static files error:', err);
  }

  return app;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
