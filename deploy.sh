#!/bin/bash

# Portfolio Auto-Deployment Script
# This script pulls the latest code from GitHub and redeploys the Docker container

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /opt/portfolio

# Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Rebuild and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

# Show running containers
echo "✅ Deployment complete! Running containers:"
docker-compose ps

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50
