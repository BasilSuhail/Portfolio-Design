import { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  size: number;
  layer: number; // 0 far, 1 middle, 2 close to the lens
  speed: number;
  drift: number;
  phase: number;
  spin: number;
  alpha: number;
  sprite: number;
}

// Far flakes are small, slow and many. Near ones are few, large and out of focus.
const LAYERS = [
  { per: 7000, size: [1.2, 2.6], speed: [22, 40], alpha: [0.35, 0.7], blur: 0.35 },
  { per: 20000, size: [3, 6], speed: [45, 80], alpha: [0.6, 0.95], blur: 0.5 },
  { per: 110000, size: [10, 24], speed: [95, 150], alpha: [0.18, 0.4], blur: 1 },
];
const SPRITES_PER_LAYER = 4;

const pick = ([min, max]: number[]) => min + Math.random() * (max - min);

interface Clump {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}
const clumps: Clump[] = [];

/** Snow knocked loose at a point in the window: a few clumps that tumble down and fade. */
export function knockSnow(x: number, y: number, count: number, push: number) {
  for (let i = 0; i < count && clumps.length < 400; i++) {
    clumps.push({
      x: x + (Math.random() - 0.5) * 22,
      y: y + (Math.random() - 0.5) * 6,
      vx: push * (0.25 + Math.random() * 0.5) + (Math.random() - 0.5) * 70,
      vy: -30 - Math.random() * 90,
      size: 1.6 + Math.random() * 3.2,
      life: 1,
    });
  }
}

/** A flake is a small irregular clump with a soft edge, not a perfect disc. */
function makeSprite(softness: number): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const lobes = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < lobes; i++) {
    const angle = Math.random() * Math.PI * 2;
    const off = i === 0 ? 0 : 4 + Math.random() * 7;
    const cx = size / 2 + Math.cos(angle) * off;
    const cy = size / 2 + Math.sin(angle) * off;
    const r = (i === 0 ? 17 : 8 + Math.random() * 8) * (1 + softness * 0.25);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(Math.max(0.05, 0.62 - softness * 0.55), "rgba(246,250,255,.85)");
    g.addColorStop(1, "rgba(235,243,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

/** Snowfall over the whole window, with depth, gusting wind and tumbling flakes. Never blocks clicks. */
export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = LAYERS.map((l) => Array.from({ length: SPRITES_PER_LAYER }, () => makeSprite(l.blur)));
    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let frame = 0;
    let last = performance.now();
    let clock = 0;

    const spawn = (layer: number, anywhere: boolean): Flake => {
      const l = LAYERS[layer];
      return {
        layer,
        x: Math.random() * (width + 200) - 100,
        y: anywhere ? Math.random() * height : -30,
        size: pick(l.size),
        speed: pick(l.speed),
        drift: 6 + Math.random() * 18 * (layer + 1),
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 1.6,
        alpha: pick(l.alpha),
        sprite: Math.floor(Math.random() * SPRITES_PER_LAYER),
      };
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      flakes = LAYERS.flatMap((l, layer) =>
        Array.from({ length: Math.min(260, Math.round((width * height) / l.per)) }, () => spawn(layer, true)),
      );
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      // Wind leans one way, with slow gusts on top.
      const wind = 14 + Math.sin(clock * 0.23) * 16 + Math.sin(clock * 0.71 + 1.3) * 7;
      // Each flake leaves its own rotation on the canvas, so reset before wiping the frame.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const near = 0.45 + f.layer * 0.5;
        f.phase += dt * (0.7 + f.layer * 0.25);
        f.y += f.speed * dt * (1 + Math.sin(f.phase * 1.7) * 0.12);
        f.x += (wind * near + Math.cos(f.phase) * f.drift) * dt;
        if (f.y - f.size > height || f.x > width + 120 || f.x < -120) {
          flakes[i] = spawn(f.layer, false);
          continue;
        }
        ctx.globalAlpha = f.alpha;
        const ratio = canvas.width / width;
        const angle = f.phase * f.spin;
        const cos = Math.cos(angle) * ratio;
        const sin = Math.sin(angle) * ratio;
        ctx.setTransform(cos, sin, -sin, cos, f.x * ratio, f.y * ratio);
        ctx.drawImage(sprites[f.layer][f.sprite], -f.size, -f.size, f.size * 2, f.size * 2);
      }
      // Snow knocked off a pile falls under gravity, in front of everything else.
      ctx.setTransform(canvas.width / width, 0, 0, canvas.width / width, 0, 0);
      for (let i = clumps.length - 1; i >= 0; i--) {
        const c = clumps[i];
        c.vy += 900 * dt;
        c.vx *= 1 - 1.5 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.life -= dt * 0.7;
        if (c.life <= 0 || c.y > height + 20) {
          clumps.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.min(1, c.life * 2);
        ctx.drawImage(sprites[1][i % SPRITES_PER_LAYER], c.x - c.size, c.y - c.size, c.size * 2, c.size * 2);
      }
      ctx.globalAlpha = 1;
      if (!still) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40 h-full w-full" aria-hidden="true" />;
}
