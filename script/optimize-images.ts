import sharp from "sharp";
import path from "path";
import { readdirSync, existsSync, mkdirSync } from "fs";

const UPLOADS_DIR = path.resolve("client/public/uploads");
const OPTIMIZED_DIR = path.resolve("client/public/uploads/optimized");

// Define target sizes based on how images are actually displayed
// Project screenshots also generate a smaller "-sm" variant for mobile
const PROJECT_IMAGES = ["Budgeting.png", "Investment.png", "interview.png"];

const IMAGE_CONFIGS: Record<string, { width: number; quality: number }> = {
  // Project screenshots: 1440w for desktop (2x), 780w variant generated separately
  "Budgeting.png": { width: 1440, quality: 80 },
  "Investment.png": { width: 1440, quality: 80 },
  "interview.png": { width: 1440, quality: 80 },

  // Headshot: displayed at 128x128, generate 2x
  "headshot.png": { width: 256, quality: 85 },

  // Icons: displayed at 32x32 or smaller, generate 2x
  "msdynamics.png": { width: 64, quality: 80 },
  "powerpoint.png": { width: 64, quality: 80 },
  "excel.png": { width: 64, quality: 80 },
  "Sage.png": { width: 64, quality: 80 },

  // Logos: displayed at 48x48 or smaller, generate 2x
  "UoA.png": { width: 96, quality: 80 },
  "UMT.png": { width: 96, quality: 80 },
  "pfsl.png": { width: 96, quality: 80 },
  "dubizzle.png": { width: 96, quality: 80 },
  "Scotflag.png": { width: 64, quality: 80 },

  // Game assets: keep original dimensions, just convert format
  "background.png": { width: 0, quality: 80 },
  "sprites.png": { width: 0, quality: 80 },
  "dino-sprite.png": { width: 0, quality: 80 },

  // Other
  "Claude.png": { width: 64, quality: 80 },
  "favicon.png": { width: 64, quality: 80 },
};

async function optimizeImages() {
  if (!existsSync(OPTIMIZED_DIR)) {
    mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }

  const files = readdirSync(UPLOADS_DIR).filter(
    (f) => f.endsWith(".png") && !f.startsWith(".")
  );

  console.log(`Found ${files.length} PNG files to optimize\n`);

  for (const file of files) {
    const inputPath = path.join(UPLOADS_DIR, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(OPTIMIZED_DIR, `${baseName}.webp`);

    const config = IMAGE_CONFIGS[file] || { width: 0, quality: 80 };

    try {
      let pipeline = sharp(inputPath);
      const metadata = await sharp(inputPath).metadata();

      console.log(
        `Processing: ${file} (${metadata.width}x${metadata.height})`
      );

      // Resize if width is specified and image is larger
      if (config.width > 0 && metadata.width && metadata.width > config.width) {
        pipeline = pipeline.resize(config.width, undefined, {
          withoutEnlargement: true,
          fit: "inside",
        });
      }

      // Convert to WebP
      await pipeline
        .webp({ quality: config.quality, effort: 6 })
        .toFile(outputPath);

      const outputMeta = await sharp(outputPath).metadata();
      const inputSize = (metadata.size || 0) / 1024;
      const outputSize = (outputMeta.size || 0) / 1024;
      const savings = inputSize - outputSize;
      const pct = inputSize > 0 ? ((savings / inputSize) * 100).toFixed(1) : 0;

      console.log(
        `  -> ${baseName}.webp (${outputMeta.width}x${outputMeta.height}) | ` +
          `${inputSize.toFixed(0)} KB -> ${outputSize.toFixed(0)} KB | ` +
          `Saved ${savings.toFixed(0)} KB (${pct}%)\n`
      );

      // Generate smaller mobile variant for project screenshots
      if (PROJECT_IMAGES.includes(file)) {
        const smOutputPath = path.join(OPTIMIZED_DIR, `${baseName}-sm.webp`);
        const smWidth = 780;

        let smPipeline = sharp(inputPath);
        if (metadata.width && metadata.width > smWidth) {
          smPipeline = smPipeline.resize(smWidth, undefined, {
            withoutEnlargement: true,
            fit: "inside",
          });
        }
        await smPipeline
          .webp({ quality: config.quality, effort: 6 })
          .toFile(smOutputPath);

        const smMeta = await sharp(smOutputPath).metadata();
        const smSize = (smMeta.size || 0) / 1024;
        console.log(
          `  -> ${baseName}-sm.webp (${smMeta.width}x${smMeta.height}) | ${smSize.toFixed(0)} KB (mobile)\n`
        );
      }
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  console.log("Image optimization complete!");
}

optimizeImages().catch(console.error);
