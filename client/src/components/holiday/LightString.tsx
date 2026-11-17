import { seeded } from "./snowArt";

export const BULB_COLOURS = [
  { name: "red", core: "#ffd9d2", mid: "#ff3b2f", edge: "#8f0f08" },
  { name: "amber", core: "#fff3cf", mid: "#ffab1a", edge: "#9a5200" },
  { name: "green", core: "#dcffe6", mid: "#21cf5b", edge: "#0a6b2b" },
  { name: "blue", core: "#dcecff", mid: "#2f8dff", edge: "#0b3f96" },
  { name: "warm", core: "#ffffff", mid: "#ffd98a", edge: "#c98a2b" },
];
const WARM = 4;

/** Gradients shared by every string on the page. Render once. */
export function LightDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {BULB_COLOURS.map((c) => (
          <radialGradient key={c.name} id={`holiday-bulb-${c.name}`} cx="42%" cy="45%" r="65%">
            <stop offset="0" stopColor={c.core} />
            <stop offset="0.45" stopColor={c.mid} />
            <stop offset="1" stopColor={c.edge} />
          </radialGradient>
        ))}
        {BULB_COLOURS.map((c) => (
          <radialGradient key={c.name} id={`holiday-glow-${c.name}`}>
            <stop offset="0" stopColor={c.mid} stopOpacity="0.75" />
            <stop offset="0.3" stopColor={c.mid} stopOpacity="0.3" />
            <stop offset="1" stopColor={c.mid} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
    </svg>
  );
}

export interface LightStringProps {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** How far each loop of wire hangs below the straight line between its ends. */
  sag: number;
  swags?: number;
  /** "warm" is a string of small warm-white lights; "mixed" is larger coloured bulbs. */
  kind?: "mixed" | "warm";
  seed: number;
  hidden?: boolean;
}

/** A string of lights from A to B: sagging wire, sockets, glass bulbs and their glow. */
export function LightString({ ax, ay, bx, by, sag, swags = 1, kind = "mixed", seed, hidden }: LightStringProps) {
  const rand = seeded(seed);
  const scale = kind === "warm" ? 0.62 : 1;
  const spacing = kind === "warm" ? 21 : 34;
  let wire = `M${ax.toFixed(1)} ${ay.toFixed(1)}`;
  const bulbs: { x: number; y: number; tilt: number; colour: number; delay: number; period: number }[] = [];
  let colour = Math.floor(rand() * 4);

  for (let s = 0; s < swags; s++) {
    const x0 = ax + ((bx - ax) * s) / swags;
    const y0 = ay + ((by - ay) * s) / swags;
    const x1 = ax + ((bx - ax) * (s + 1)) / swags;
    const y1 = ay + ((by - ay) * (s + 1)) / swags;
    const cx = (x0 + x1) / 2 + (rand() - 0.5) * 8;
    const cy = (y0 + y1) / 2 + sag * 2 * (0.8 + rand() * 0.4);
    wire += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;

    const count = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / spacing));
    for (let j = 0; j < count; j++) {
      const t = (j + 0.5 + (rand() - 0.5) * 0.3) / count;
      const u = 1 - t;
      bulbs.push({
        x: u * u * x0 + 2 * u * t * cx + t * t * x1,
        y: u * u * y0 + 2 * u * t * cy + t * t * y1,
        tilt: (rand() - 0.5) * 34,
        colour: kind === "warm" ? WARM : colour++ % 4,
        delay: -rand() * 6,
        period: 2.6 + rand() * 3.4,
      });
    }
  }

  return (
    <svg
      className="absolute left-0 top-0 overflow-visible transition-opacity duration-200"
      width="1"
      height="1"
      style={{ opacity: hidden ? 0 : 1 }}
      aria-hidden="true"
    >
      <path d={wire} fill="none" stroke="#0c120e" strokeWidth={2.2 * scale + 0.4} strokeLinecap="round" />
      <path d={wire} fill="none" stroke="#3d5a45" strokeWidth={0.9} strokeLinecap="round" strokeDasharray="5 3" />
      {bulbs.map((b, i) => {
        const c = BULB_COLOURS[b.colour];
        return (
          <g
            key={i}
            data-bulb=""
            data-x={b.x.toFixed(1)}
            data-y={b.y.toFixed(1)}
            data-tilt={b.tilt.toFixed(1)}
            data-scale={scale}
            transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.tilt.toFixed(1)}) scale(${scale})`}
          >
            <circle
              className="holiday-glow"
              cy="11"
              r={kind === "warm" ? 30 : 26}
              fill={`url(#holiday-glow-${c.name})`}
              style={{ animationDelay: `${b.delay.toFixed(2)}s`, animationDuration: `${b.period.toFixed(2)}s` }}
            />
            <rect x="-2.4" y="-0.5" width="4.8" height="6" rx="1.1" fill="#16241a" />
            <rect x="-2.4" y="1.4" width="4.8" height="1" fill="#33503c" />
            <path d="M-3.4 5.2 C-5.4 9.5 -3.4 15.5 0 18.4 C3.4 15.5 5.4 9.5 3.4 5.2 Z" fill={`url(#holiday-bulb-${c.name})`} />
            <ellipse cx="0" cy="10.5" rx="1.7" ry="3.4" fill="#fff" opacity="0.6" />
            <ellipse cx="-1.9" cy="8.2" rx="0.8" ry="1.9" fill="#fff" opacity="0.75" transform="rotate(14 -1.9 8.2)" />
          </g>
        );
      })}
    </svg>
  );
}

interface Swing {
  angle: number;
  speed: number;
  gain: number; // how hard this bulb reacts, and which way it kicks first
  stiffness: number;
  x: number;
  y: number;
  tilt: number;
  scale: number;
  scrolls: boolean; // true for bulbs that move with the page
  resting: boolean;
}
const swings = new WeakMap<Element, Swing>();

function swingOf(el: Element): Swing {
  let s = swings.get(el);
  if (!s) {
    const d = (el as SVGGElement).dataset;
    s = {
      angle: 0,
      speed: 0,
      gain: (0.6 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1),
      stiffness: 55 + Math.random() * 40,
      x: Number(d.x),
      y: Number(d.y),
      tilt: Number(d.tilt),
      scale: Number(d.scale),
      scrolls: !!el.closest("[data-holiday-layer='page']"),
      resting: true,
    };
    swings.set(el, s);
  }
  return s;
}

/**
 * One step of the bulbs' swing. Each bulb is a small pendulum: scrolling shoves it, and it then
 * rings down on its own. `scrollSpeed` is in px per second.
 */
export function swingBulbs(dt: number, scrollSpeed: number) {
  document.querySelectorAll("[data-bulb]").forEach((el) => {
    const s = swingOf(el);
    const shove = (s.scrolls ? 1 : 0.6) * -scrollSpeed * s.gain * 1.7;
    if (s.resting && Math.abs(shove) < 1) return;
    // The string may have been re-hung somewhere else since the last step.
    const d = (el as SVGGElement).dataset;
    s.x = Number(d.x);
    s.y = Number(d.y);
    s.speed += (-s.stiffness * s.angle - 2.4 * s.speed + shove) * dt;
    s.angle = Math.max(-62, Math.min(62, s.angle + s.speed * dt));
    s.resting = Math.abs(s.angle) < 0.05 && Math.abs(s.speed) < 0.5 && Math.abs(shove) < 1;
    el.setAttribute("transform", `translate(${s.x} ${s.y}) rotate(${(s.tilt + s.angle).toFixed(2)}) scale(${s.scale})`);
  });
}

/** The pointer brushing past a bulb sets it swinging. Coordinates are in the window. */
export function nudgeBulbs(px: number, py: number, pointerSpeedX: number) {
  document.querySelectorAll("[data-bulb]").forEach((el) => {
    const s = swingOf(el);
    const x = s.x - (s.scrolls ? window.scrollX : 0);
    const y = s.y + 10 * s.scale - (s.scrolls ? window.scrollY : 0);
    if (Math.abs(px - x) > 14 || Math.abs(py - y) > 16) return;
    s.speed += Math.max(-500, Math.min(500, -pointerSpeedX * 0.5)) || (Math.random() - 0.5) * 300;
    s.resting = false;
  });
}
