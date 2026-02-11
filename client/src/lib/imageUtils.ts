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

/** Project images that have a -sm (780w) variant for responsive loading. */
const RESPONSIVE_IMAGES = ["Budgeting", "Investment", "interview"];

/**
 * Returns a srcSet string for project images that have multiple sizes.
 * Returns undefined for images without responsive variants.
 */
export function getResponsiveSrcSet(originalUrl: string): string | undefined {
  if (!originalUrl || !originalUrl.startsWith("/uploads/")) return undefined;

  const match = originalUrl.match(/^\/uploads\/(.+)\.(png|jpg|jpeg)$/i);
  if (!match) return undefined;

  const baseName = match[1];
  if (!RESPONSIVE_IMAGES.includes(baseName)) return undefined;

  return `/uploads/optimized/${baseName}-sm.webp 780w, /uploads/optimized/${baseName}.webp 1440w`;
}
