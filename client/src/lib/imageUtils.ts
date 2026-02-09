/**
 * Maps an original image path to its optimized WebP version.
 * Falls back to the original path if no optimized version exists.
 */
export function getOptimizedImageUrl(originalUrl: string): string {
  if (!originalUrl || !originalUrl.startsWith("/uploads/")) return originalUrl;

  // Extract filename without extension
  const match = originalUrl.match(/^\/uploads\/(.+)\.(png|jpg|jpeg)$/i);
  if (!match) return originalUrl;

  const baseName = match[1];
  return `/uploads/optimized/${baseName}.webp`;
}
