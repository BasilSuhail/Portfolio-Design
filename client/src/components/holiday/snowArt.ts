// Draws settled snow as images: on the tops of real letter shapes, or along a flat ledge.

export interface SnowImage {
  canvas: HTMLCanvasElement; // the full pile, drawn at SNOW_SCALE
  surface: Float32Array; // top of the snow in each pixel column, -1 where there is none
  top: Float32Array; // the thing the snow rests on in each column
  width: number; // CSS px
  height: number;
  padX: number; // empty margin left and right of the surface
  padTop: number; // room above the surface for the snow to pile into
}

const SCALE = 2; // draw at double size so the snow edge stays crisp
export const SNOW_SCALE = SCALE;
const OVERLAP = SCALE * 1.5; // snow sinks slightly into the surface so no gap shows
const GLOW = 6;

/** Small repeatable random generator, so a given heading always gets the same drift. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Smooth random curve between 0 and 1, used for the uneven depth of a drift. */
function unevenness(length: number, step: number, rand: () => number): Float32Array {
  const out = new Float32Array(length);
  const layer = (size: number, weight: number) => {
    const knots = Array.from({ length: Math.ceil(length / size) + 2 }, () => rand());
    for (let x = 0; x < length; x++) {
      const i = Math.floor(x / size);
      const t = (1 - Math.cos(((x / size) % 1) * Math.PI)) / 2;
      out[x] += (knots[i] * (1 - t) + knots[i + 1] * t) * weight;
    }
  };
  layer(step, 0.7);
  layer(Math.max(2, step / 3.5), 0.3);
  return out;
}

/**
 * Piles snow on a surface. `top[x]` is the y of the surface in each pixel column, or -1 where
 * there is nothing to land on. Each unbroken stretch gets its own rounded cap.
 */
function pile(top: Float32Array, width: number, height: number, depth: number, seed: number, lumpy = 0.6) {
  const rand = seeded(seed);
  const rough = unevenness(width, depth * 1.6, rand);
  const surface = new Float32Array(width).fill(-1);

  let x = 0;
  while (x < width) {
    if (top[x] < 0) {
      x++;
      continue;
    }
    let end = x;
    while (end < width && top[end] >= 0) end++;
    const run = end - x;
    const shoulder = Math.max(1, Math.min(depth * 0.9, run * 0.4));
    const raw = new Float32Array(run);
    for (let i = 0; i < run; i++) {
      const edge = Math.min(i, run - 1 - i) / shoulder;
      const taper = Math.sqrt(Math.min(1, edge));
      raw[i] = top[x + i] - depth * (1.1 - lumpy + lumpy * 1.6 * rough[x + i]) * taper;
    }
    // Soften the outline so snow slumps down a step instead of standing in a wall.
    const reach = Math.max(1, Math.round(Math.min(depth * 0.45, run / 4)));
    for (let pass = 0; pass < 2; pass++) {
      const copy = raw.slice();
      for (let i = 0; i < run; i++) {
        let sum = 0;
        let n = 0;
        for (let k = Math.max(0, i - reach); k <= Math.min(run - 1, i + reach); k++) {
          sum += copy[k];
          n++;
        }
        raw[i] = sum / n;
      }
    }
    for (let i = 0; i < run; i++) surface[x + i] = Math.min(raw[i], top[x + i]);
    x = end;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  const px = image.data;
  const overlap = OVERLAP;
  for (let cx = 0; cx < width; cx++) {
    if (surface[cx] < 0 || top[cx] - surface[cx] < 0.6) continue;
    const from = surface[cx];
    const to = Math.min(height - 1, top[cx] + overlap);
    for (let y = Math.floor(from); y <= to; y++) {
      const t = Math.min(1, Math.max(0, (y - from) / Math.max(1, to - from)));
      const shade = Math.pow(t, 2.2) * 0.9; // bright crown, cool blue shadow underneath
      const i = (y * width + cx) * 4;
      px[i] = 255 - 70 * shade;
      px[i + 1] = 255 - 50 * shade;
      px[i + 2] = 255 - 22 * shade;
      px[i + 3] = y < from ? 255 * (1 - (from - y)) : 250;
    }
  }
  ctx.putImageData(image, 0, 0);

  // A second pass adds the faint cold glow fresh snow has at night.
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const octx = out.getContext("2d")!;
  octx.shadowColor = "rgba(170, 200, 255, .45)";
  octx.shadowBlur = SCALE * 2.5;
  octx.drawImage(canvas, 0, 0);
  return { canvas: out, surface, top };
}

/**
 * Paints a pile with part of it missing. `amount` holds, per pixel column, how much of the full
 * depth is there (0 to 1), so snow can be knocked off in one spot and grow back.
 */
export function drawSnow(target: HTMLCanvasElement, art: SnowImage, amount: Float32Array) {
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, target.width, target.height);
  const strip = 3;
  for (let x = 0; x < art.canvas.width; x += strip) {
    const s = art.surface[x];
    const a = amount[x];
    if (s < 0 || a < 0.03) continue;
    const bottom = art.top[x] + OVERLAP;
    const sy = Math.max(0, s - GLOW);
    const dy = sy + (1 - a) * (art.top[x] - s);
    ctx.drawImage(art.canvas, x, sy, strip, bottom - sy, x, dy, strip, bottom - dy);
  }
}

const cache = new Map<string, SnowImage | null>();

/** Snow lying on the tops of the letters of `text`, drawn in the given font. */
export function snowOnText(text: string, font: string, letterSpacing: string, fontSize: number, seed: number): SnowImage | null {
  const key = `t|${text}|${font}|${letterSpacing}|${seed}`;
  if (cache.has(key)) return cache.get(key)!;

  const depth = Math.max(2.2, Math.min(24, fontSize * 0.13));
  const padX = Math.ceil(depth * 1.2);
  const padTop = Math.ceil(depth * 2.4);
  const probe = document.createElement("canvas").getContext("2d")!;
  const setFont = (c: CanvasRenderingContext2D) => {
    c.font = font;
    if (letterSpacing !== "normal" && "letterSpacing" in c) (c as any).letterSpacing = letterSpacing;
    c.textBaseline = "alphabetic";
  };
  setFont(probe);
  const m = probe.measureText(text);
  const ascent = m.fontBoundingBoxAscent ?? fontSize;
  const descent = m.fontBoundingBoxDescent ?? fontSize * 0.25;
  const width = Math.ceil(m.width) + padX * 2;
  const height = Math.ceil(padTop + ascent + descent);

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(SCALE, SCALE);
  setFont(ctx);
  ctx.fillText(text, padX, padTop + ascent);

  // Find the highest inked pixel in each column: that is where snow would land.
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const top = new Float32Array(canvas.width).fill(-1);
  for (let cx = 0; cx < canvas.width; cx++) {
    for (let y = 0; y < canvas.height; y++) {
      if (data[(y * canvas.width + cx) * 4 + 3] > 128) {
        top[cx] = y;
        break;
      }
    }
  }
  const result: SnowImage = { ...pile(top, canvas.width, canvas.height, depth * SCALE, seed), width, height, padX, padTop };
  cache.set(key, result);
  return result;
}

/** A drift lying along a flat edge `length` px long, such as the top of a card or a bar. */
export function snowOnLedge(length: number, depth: number, seed: number): SnowImage {
  const key = `l|${Math.round(length)}|${depth}|${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const padX = 4;
  const padTop = Math.ceil(depth * 2.2);
  const width = Math.round(length) + padX * 2;
  const height = padTop + 4;
  const top = new Float32Array(width * SCALE).fill(-1);
  // Snow gathers in patches along an edge rather than as one even strip.
  const patches = unevenness(width * SCALE, 70 * SCALE, seeded(seed + 7));
  for (let cx = padX * SCALE; cx < (width - padX) * SCALE; cx++) {
    if (patches[cx] > 0.4) top[cx] = padTop * SCALE;
  }
  const result: SnowImage = { ...pile(top, width * SCALE, height * SCALE, depth * SCALE, seed, 0.95), width, height, padX, padTop };
  cache.set(key, result);
  return result;
}
