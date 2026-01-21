# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Cache busting - copy version file to invalidate cache on new commits
COPY .buildversion* ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/content.json ./content.json

# Create directories for persistent data (will be volume mounted)
RUN mkdir -p /app/client/public/uploads /app/gallery-data

# Copy default gallery files to gallery-data (will be overridden by volume mount)
COPY --from=builder /app/gallery.json ./gallery-data/gallery.json
COPY --from=builder /app/gallery_settings.json ./gallery-data/gallery_settings.json

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/content', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
