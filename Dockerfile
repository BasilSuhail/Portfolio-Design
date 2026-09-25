FROM node:22-slim AS builder

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/init-news.js ./init-news.js
COPY --from=builder /app/content.json ./content.json
COPY --from=builder /app/gallery_settings.json ./gallery_settings.json
COPY --from=builder /app/client/public/uploads ./client/public/uploads

RUN mkdir -p /app/news-data /app/gallery-data

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/content', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
