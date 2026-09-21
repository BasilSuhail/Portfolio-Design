const OPTIMIZED_FILES = new Set([
  "background", "Budgeting", "dubizzle", "excel", "headshot",
  "homeforge", "intelligence-platform", "msdynamics",
  "og-preview", "osint-auroc", "osint-dashboard", "osint-guide",
  "osint-sensor-narrative", "pfsl", "pi-homelab", "Sage", "sprites",
  "UMT", "UoA",
]);

export function getOptimizedImageUrl(originalUrl: string): string {
  if (!originalUrl || !originalUrl.startsWith("/uploads/")) return originalUrl;

  const match = originalUrl.match(/^\/uploads\/(.+)\.(png|jpg|jpeg)$/i);
  if (!match) return originalUrl;

  const baseName = match[1];
  if (!OPTIMIZED_FILES.has(baseName)) return originalUrl;
  return `/uploads/optimized/${baseName}.webp`;
}

/** Project images that have a -sm (780w) variant for responsive loading. */
const RESPONSIVE_IMAGES = [
  "Budgeting", "osint-dashboard", "pi-homelab", "homeforge",
  "intelligence-platform", "osint-guide", "osint-auroc",
  "osint-sensor-narrative",
];

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
