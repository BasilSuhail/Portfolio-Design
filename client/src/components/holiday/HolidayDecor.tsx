import { useEffect, useRef, useState } from "react";
import { LightDefs, LightString, nudgeBulbs, swingBulbs, type LightStringProps } from "./LightString";
import { knockSnow } from "./Snowfall";
import { SNOW_SCALE, drawSnow, hash, seeded, snowOnLedge, snowOnText, type SnowImage } from "./snowArt";

interface SnowSpot {
  key: string;
  /** Names the place, whatever size it currently is, so a pile survives its host being resized. */
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rows cut off the bottom, for snow on letters that pass behind something. */
  cut?: number;
}
type LightSpot = Omit<LightStringProps, "hidden"> & { key: string };
interface Scene {
  snow: SnowSpot[];
  lights: LightSpot[];
}

const EMPTY: Scene = { snow: [], lights: [] };
const PAGE_EVERY = 3; // frames between re-measuring things that scroll with the page
const REGROW_SECONDS = 28; // a pile knocked flat is back to full depth after this long
const NEW_PILE_SECONDS = 7; // how often snow starts settling somewhere new

// The drawing for each pile, kept out of React state because it holds large pixel arrays.
const arts = new Map<string, SnowImage>();

/** How much of each pile is currently there, column by column. */
interface PileState {
  amount: Float32Array;
  full: boolean;
  drawnOn: HTMLCanvasElement | null;
  dirty: boolean;
}

function firstText(el: Element): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent?.trim()) return node as Text;
  }
  return null;
}

/** Snow on the letters of one element. Skips text that wraps over more than one line. */
function letterSnow(el: Element, seed: number, dx: number, dy: number): SnowSpot | null {
  const node = firstText(el);
  if (!node) return null;
  const range = document.createRange();
  range.selectNodeContents(node);
  const rects = range.getClientRects();
  if (rects.length !== 1 || rects[0].width < 8) return null;
  const rect = rects[0];
  const cs = getComputedStyle(el);
  let text = node.textContent!.replace(/\s+/g, " ").trim();
  if (cs.textTransform === "uppercase") text = text.toUpperCase();
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const art = snowOnText(text, font, cs.letterSpacing, parseFloat(cs.fontSize), seed);
  if (!art) return null;
  // The measured box and the drawn one can differ by a pixel or two in height; share the difference.
  const slack = (rect.height - (art.height - art.padTop)) / 2;
  const key = `t-${text}-${Math.round(rect.width)}`;
  arts.set(key, art);
  return {
    key,
    id: `t-${text}`,
    x: rect.left - art.padX + dx,
    y: rect.top - art.padTop + slack + dy,
    w: art.width,
    h: art.height,
  };
}

/** A drift on the top edge of a box. `from` and `to` are fractions of the usable width. */
function ledgeSnow(el: Element, key: string, seed: number, depth: number, from: number, to: number, dx: number, dy: number): SnowSpot | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 40) return null;
  const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, rect.height / 2);
  const inset = radius * 0.55;
  const usable = rect.width - inset * 2;
  // Lengths go in steps, so a host that is mid-animation does not need a new drawing every frame.
  const wanted = usable * (to - from);
  const length = Math.max(48, Math.floor(wanted / 48) * 48);
  const art = snowOnLedge(length, depth, seed);
  const spotKey = `l-${key}-${Math.round(length)}`;
  arts.set(spotKey, art);
  return {
    key: spotKey,
    id: `l-${key}`,
    x: rect.left + inset + usable * from + (wanted - length) / 2 - art.padX + dx,
    y: rect.top - art.padTop + 1 + dy,
    w: art.width,
    h: art.height,
  };
}

/**
 * Lays holiday decorations over whatever page is showing: snow settled on some headings, cards
 * and bars, and strings of lights hung from a few of them. It only reads the page; nothing in
 * the page itself is changed, so it can be switched off without a trace.
 */
export function HolidayDecor() {
  const [fixed, setFixed] = useState<Scene>(EMPTY);
  const [page, setPage] = useState<Scene>(EMPTY);
  const [covered, setCovered] = useState<string>(""); // keys of page items passing under the top bar
  const session = useRef(Math.floor(Math.random() * 1e6)); // new luck on every visit
  const canvases = useRef(new Map<string, HTMLCanvasElement>());

  useEffect(() => {
    let frame = 0;
    let tick = 0;
    let lastFixed = "";
    let lastPage = "";
    let lastCovered = "";
    let pageScene: Scene = EMPTY;
    let fixedNow: Scene = EMPTY;
    const piles = new Map<string, PileState>();
    const latest = new Map<string, PileState>(); // most recent pile for each place
    const extras = new Set<string>(); // places that have started gathering snow since the page opened
    let bare: string[] = []; // places that could gather snow but have none yet
    const started = performance.now();
    let last = started;
    let lastScroll = window.scrollY;
    let scrollSpeed = 0;
    let sinceNewPile = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chance = (name: string, odds: number) => {
      if (extras.has(name) || seeded(hash(name) + session.current)() < odds) return true;
      bare.push(name);
      return false;
    };
    const seedOf = (name: string) => hash(name) + session.current;

    const measureFixed = (): Scene => {
      const scene: Scene = { snow: [], lights: [] };
      const vw = window.innerWidth;
      const bar = document.querySelector("header .glass-bar");
      if (bar) {
        const r = bar.getBoundingClientRect();
        const round = Math.min(r.height / 2, 28);
        const cap = ledgeSnow(bar, "bar", seedOf("bar"), 8, 0.02, 0.98, 0, 0);
        if (cap) scene.snow.push(cap);
        const name = bar.querySelector("a span[aria-label]");
        const onName = name && letterSnow(name, seedOf("name"), 0, 0);
        if (onName) scene.snow.push(onName);
        scene.lights.push({
          key: "bar",
          ax: r.left + round,
          ay: r.bottom - 1,
          bx: r.right - round,
          by: r.bottom - 1,
          sag: 5,
          swags: Math.max(2, Math.round(r.width / 190)),
          kind: "warm",
          seed: seedOf("bar-lights"),
        });
        // With room to spare, the string carries on from each end of the bar to the window's edges.
        if (r.left > 150) {
          const mid = r.top + r.height / 2;
          scene.lights.push(
            { key: "left", ax: -14, ay: 118, bx: r.left + 6, by: mid, sag: 22, seed: seedOf("left") },
            { key: "right", ax: r.right - 6, ay: mid, bx: vw + 14, by: 124, sag: 24, seed: seedOf("right") },
          );
        }
      }
      const toggle = document.querySelector('[data-testid="button-holiday-mode"]');
      const onToggle = toggle && ledgeSnow(toggle, "toggle", seedOf("toggle"), 6, 0.05, 0.95, 0, 0);
      if (onToggle) scene.snow.push(onToggle);
      return scene;
    };

    const measurePage = (): Scene => {
      const scene: Scene = { snow: [], lights: [] };
      bare = [];
      const dx = window.scrollX;
      const dy = window.scrollY;
      const add = (spot: SnowSpot | null) => spot && scene.snow.push(spot);
      const hang = (el: Element | null, key: string, opts: { sag: number; kind?: "mixed" | "warm"; per?: number; inset?: number }) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 60) return;
        const inset = opts.inset ?? 0;
        scene.lights.push({
          key,
          ax: r.left + inset + dx,
          ay: r.bottom - 1 + dy,
          bx: r.right - inset + dx,
          by: r.bottom - 1 + dy,
          sag: opts.sag,
          swags: Math.max(1, Math.round(r.width / (opts.per ?? 170))),
          kind: opts.kind,
          seed: seedOf(key),
        });
      };

      // Letters: the big faint words always, section headings mostly, card titles now and then.
      document.querySelectorAll("main .backdrop-word").forEach((el) => {
        const spot = letterSnow(el, seedOf("word"), dx, dy);
        if (!spot) return;
        // The glass bar lies across the middle of the word; snow must not show in front of it.
        const over = el.parentElement?.querySelector(".glass-bar")?.getBoundingClientRect();
        if (over) spot.cut = Math.max(0, spot.y + spot.h - (over.top + dy) - 1);
        scene.snow.push(spot);
      });
      document.querySelectorAll("main h2").forEach((el) => {
        if (chance(`h2${el.textContent}`, 0.75)) add(letterSnow(el, seedOf(el.textContent ?? ""), dx, dy));
      });
      document.querySelectorAll("main h3").forEach((el) => {
        if (chance(`h3${el.textContent}`, 0.3)) add(letterSnow(el, seedOf(el.textContent ?? ""), dx, dy));
      });

      // Tiles: a drift on part of the top edge of some project cards, and lights under a couple.
      document.querySelectorAll('[data-section="projects"] .grid > *').forEach((card, i) => {
        const id = `card${i}${card.textContent?.slice(0, 24)}`;
        const rand = seeded(seedOf(id));
        const lucky = rand() < 0.45;
        if (lucky || chance(id, 0)) {
          const start = rand() * 0.45;
          add(ledgeSnow(card, id, seedOf(id), 8 + rand() * 5, start, Math.min(1, start + 0.4 + rand() * 0.5), dx, dy));
        }
        if (rand() < 0.22) hang(card, `card-lights-${i}`, { sag: 9, inset: 18, per: 150 });
      });

      const pill = document.querySelector('[data-testid="button-copy-email"]');
      if (pill) {
        add(ledgeSnow(pill, "pill", seedOf("pill"), 6, 0.05, 0.95, dx, dy));
        hang(pill, "pill-lights", { sag: 5, kind: "warm", inset: 16, per: 140 });
      }
      const contact = document.querySelector('[data-section="contact"] .glass-bar');
      if (contact) {
        add(ledgeSnow(contact, "contact", seedOf("contact"), 10, 0.03, 0.97, dx, dy));
        hang(contact, "contact-lights", { sag: 12, inset: 22 });
      }
      document.querySelectorAll('[data-section="journey"] [data-orientation="horizontal"]').forEach((line, i) => {
        if (chance(`rule${i}`, 0.3)) hang(line, `rule-${i}`, { sag: 10, kind: i % 2 ? "warm" : "mixed", per: 200 });
      });
      hang(document.querySelector("footer .border-t"), "footer", { sag: 14, per: 180 });
      // Sits just above the footer rule rather than below it.
      const footer = scene.lights.find((l) => l.key === "footer");
      const rule = document.querySelector("footer .border-t")?.getBoundingClientRect();
      if (footer && rule) footer.ay = footer.by = rule.top + dy;
      return scene;
    };

    /** Grows piles back, and repaints the ones that changed. */
    const tendSnow = (dt: number) => {
      const young = performance.now() - started < 1500;
      for (const spot of [...fixedNow.snow, ...pageScene.snow]) {
        const art = arts.get(spot.key);
        if (!art) continue;
        let pile = piles.get(spot.key);
        if (!pile) {
          // Piles there from the start are already deep; later ones begin bare and build up.
          // A place that changed size keeps roughly the snow it had.
          const before = latest.get(spot.id);
          const fill = before ? before.amount.reduce((a, b) => a + b, 0) / before.amount.length : young || still ? 1 : 0;
          const amount = new Float32Array(art.canvas.width).fill(fill);
          pile = { amount, full: fill === 1, drawnOn: null, dirty: true };
          piles.set(spot.key, pile);
        }
        latest.set(spot.id, pile);
        if (!pile.full && tick % 4 === 0) {
          let full = true;
          const grow = (dt * 4) / REGROW_SECONDS;
          for (let i = 0; i < pile.amount.length; i++) {
            if (pile.amount[i] < 1) {
              pile.amount[i] = Math.min(1, pile.amount[i] + grow);
              full = full && pile.amount[i] === 1;
            }
          }
          pile.full = full;
          pile.dirty = true;
        }
        const canvas = canvases.current.get(spot.key);
        if (canvas && (pile.dirty || pile.drawnOn !== canvas)) {
          drawSnow(canvas, art, pile.amount);
          pile.drawnOn = canvas;
          pile.dirty = false;
        }
      }
    };

    /** The pointer ploughing through a pile knocks the snow off around it. */
    let px = 0;
    let py = 0;
    let pt = 0;
    const onPointer = (e: PointerEvent) => {
      const now = performance.now();
      const gap = Math.max(1, now - pt);
      const vx = ((e.clientX - px) / gap) * 1000;
      const speed = (Math.hypot(e.clientX - px, e.clientY - py) / gap) * 1000;
      px = e.clientX;
      py = e.clientY;
      pt = now;
      if (gap > 200) return; // first move after a pause: no speed to go on yet
      nudgeBulbs(px, py, vx);

      const hit = (spot: SnowSpot, ox: number, oy: number) => {
        const art = arts.get(spot.key);
        const pile = piles.get(spot.key);
        const lx = px - (spot.x - ox);
        const ly = py - (spot.y - oy);
        if (!art || !pile || lx < -12 || lx > spot.w + 12 || ly < -12 || ly > spot.h + 12) return;
        const centre = Math.round(lx * SNOW_SCALE);
        const reach = 15 * SNOW_SCALE;
        const y = ly * SNOW_SCALE;
        const strength = Math.min(1, 0.3 + speed / 900);
        let removed = 0;
        for (let c = Math.max(0, centre - reach * 2); c < Math.min(pile.amount.length, centre + reach * 2); c++) {
          const s = art.surface[c];
          if (s < 0 || y < s - 14 || y > art.top[c] + 14) continue;
          const loss = pile.amount[c] * strength * Math.exp(-(((c - centre) / reach) ** 2));
          pile.amount[c] -= loss;
          removed += loss * (art.top[c] - s);
        }
        if (removed < 4) return;
        pile.full = false;
        pile.dirty = true;
        knockSnow(px, py, Math.min(16, 2 + Math.round(removed / 90)), vx);
      };
      for (const spot of fixedNow.snow) hit(spot, 0, 0);
      for (const spot of pageScene.snow) hit(spot, window.scrollX, window.scrollY);
    };
    if (!still) window.addEventListener("pointermove", onPointer, { passive: true });

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Scrolling drags the page past the lights, which sets them swinging.
      const moved = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      scrollSpeed += (moved / Math.max(dt, 0.001) - scrollSpeed) * 0.35;
      if (!still) swingBulbs(dt, Math.max(-2600, Math.min(2600, scrollSpeed)));

      // Every so often snow begins to settle on something that had none.
      sinceNewPile += dt;
      if (!still && sinceNewPile > NEW_PILE_SECONDS && bare.length) {
        sinceNewPile = 0;
        extras.add(bare[Math.floor(Math.random() * bare.length)]);
      }

      const fixedScene = measureFixed();
      fixedNow = fixedScene;
      const fixedKey = JSON.stringify(fixedScene, (_, v) => (typeof v === "number" ? Math.round(v * 2) / 2 : v));
      if (fixedKey !== lastFixed) {
        lastFixed = fixedKey;
        setFixed(fixedScene);
      }

      if (tick++ % PAGE_EVERY === 0) {
        pageScene = measurePage();
        const pageKey = JSON.stringify(pageScene, (_, v) => (typeof v === "number" ? Math.round(v) : v));
        if (pageKey !== lastPage) {
          lastPage = pageKey;
          setPage(pageScene);
        }
      }
      tendSnow(dt);

      // Anything sliding under the top bar is hidden, so it never shows through or over the bar.
      const bar = document.querySelector("header .glass-bar")?.getBoundingClientRect();
      const under: string[] = [];
      if (bar) {
        const hit = (x0: number, x1: number, y0: number, y1: number) =>
          y1 - window.scrollY > bar.top - 4 && y0 - window.scrollY < bar.bottom + 4 && x1 > bar.left && x0 < bar.right;
        for (const s of pageScene.snow) if (hit(s.x, s.x + s.w, s.y, s.y + s.h)) under.push(s.key);
        for (const l of pageScene.lights) if (hit(l.ax, l.bx, l.ay - 4, l.ay + l.sag * 2 + 24)) under.push(l.key);
      }
      const coveredKey = under.join("|");
      if (coveredKey !== lastCovered) {
        lastCovered = coveredKey;
        setCovered(coveredKey);
      }
      frame = requestAnimationFrame(loop);
    };

    // Letter shapes are only right once the web font has arrived.
    let cancelled = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!cancelled) frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const hidden = new Set(covered ? covered.split("|") : []);
  const snow = (s: SnowSpot) => (
    <canvas
      key={s.key}
      ref={(el) => {
        if (el) canvases.current.set(s.key, el);
        else canvases.current.delete(s.key);
      }}
      width={s.w * SNOW_SCALE}
      height={s.h * SNOW_SCALE}
      className="absolute max-w-none transition-opacity duration-200"
      style={{
        left: s.x,
        top: s.y,
        width: s.w,
        height: s.h,
        opacity: hidden.has(s.key) ? 0 : 1,
        clipPath: s.cut ? `inset(0 0 ${s.cut}px 0)` : undefined,
      }}
    />
  );

  return (
    <div aria-hidden="true">
      <LightDefs />
      {/* Scrolls with the page */}
      <div data-holiday-layer="page" className="pointer-events-none absolute left-0 top-0 z-30 h-0 w-0">
        {page.lights.map((l) => (
          <LightString {...l} key={l.key} hidden={hidden.has(l.key)} />
        ))}
        {page.snow.map(snow)}
      </div>
      {/* Stays with the top bar */}
      <div className="pointer-events-none fixed left-0 top-0 z-[45] h-0 w-0">
        {fixed.lights.map((l) => (
          <LightString {...l} key={l.key} />
        ))}
        {fixed.snow.map(snow)}
      </div>
    </div>
  );
}
