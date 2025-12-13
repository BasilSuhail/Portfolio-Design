// Vercel serverless function wrapper
const path = require('path');

// Import the built server
const appModule = require('../dist/index.cjs');

// Export the Express app as a serverless function
module.exports = appModule.default || appModule;
