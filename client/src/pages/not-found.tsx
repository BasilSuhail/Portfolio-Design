import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useContent } from "@/hooks/use-content";

// The real pages of the site; "" is the home page.
const PAGES = ["", "gallery", "news", "blog", "market-terminal"];

const RISE_MS = 850;
const SETTLE_MS = 260;

/** Edit distance, used to guess the page the visitor meant. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

function closestPage(path: string): string | null {
  const typed = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  let best: string | null = null;
  let score = 3; // only accept close matches
  for (const page of PAGES) {
    if (!page) continue;
    const s = distance(typed, page);
    if (s < score) {
      best = page;
      score = s;
    }
  }
  return best;
}

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const { data } = useContent();
  const content = data as any;
  const name: string = content?.profile?.name || content?.hero?.name || "";
  const email: string | undefined = content?.profile?.email;

  // idle -> rising (the bar travels to the nav's place) -> landed (the real nav takes over)
  const [stage, setStage] = useState<"idle" | "rising" | "landed">("idle");
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const host = typeof window !== "undefined" ? window.location.host : "";
  const best = closestPage(location);
  // Home is always first; the closest match comes right after it.
  const pages = best ? ["", best, ...PAGES.filter((p) => p && p !== best)] : PAGES;

  const open = (e: React.MouseEvent, page: string) => {
    // Let the browser handle new-tab clicks.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (stage !== "idle") return;

    const target = `/${page}`;
    const bar = barRef.current;
    const landing = navRef.current?.querySelector<HTMLElement>(".glass-bar");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!bar || !landing || reduceMotion) {
      setLocation(target);
      return;
    }

    // Pin the bar exactly where it is now, without the centring transform...
    const from = bar.getBoundingClientRect();
    const to = landing.getBoundingClientRect();
    Object.assign(bar.style, {
      position: "fixed",
      transform: "none",
      maxWidth: "none",
      top: `${from.top}px`,
      left: `${from.left}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    bar.getBoundingClientRect(); // commit the starting position

    // ...then send it to the spot the site navigation occupies.
    bar.style.transition = ["top", "left", "width", "height", "border-radius"]
      .map((p) => `${p} ${RISE_MS}ms cubic-bezier(.32,.72,0,1)`)
      .concat(`opacity ${SETTLE_MS}ms ease`)
      .join(", ");
    Object.assign(bar.style, {
      top: `${to.top}px`,
      left: `${to.left}px`,
      width: `${to.width}px`,
      height: `${to.height}px`,
      borderRadius: getComputedStyle(landing).borderRadius,
    });
    setStage("rising");

    timers.current.push(
      setTimeout(() => setStage("landed"), RISE_MS),
      setTimeout(() => setLocation(target), RISE_MS + SETTLE_MS),
    );
  };

  const leaving = stage !== "idle";
  const fade = `transition-all duration-500 ${leaving ? "opacity-0 translate-y-3" : ""}`;

  return (
    <div className="isolate min-h-screen bg-[#efece3] dark:bg-neutral-950">
      <div className="ambient" aria-hidden="true" />

      {/* The real navigation waits, invisible, in its usual place and takes over once the bar arrives. */}
      <div
        ref={navRef}
        aria-hidden={stage !== "landed"}
        className={`fixed inset-x-0 top-0 z-40 transition-opacity ${stage === "landed" ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ transitionDuration: `${SETTLE_MS}ms` }}
      >
        <Navigation name={name || "Portfolio"} />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="relative grid w-full place-items-center">
          <div
            className={`absolute h-[60%] w-[70%] rounded-full bg-[hsla(342,85%,52%,.16)] blur-[70px] transition-opacity duration-500 dark:bg-[hsla(142,50%,45%,.2)] ${leaving ? "opacity-0" : ""}`}
            aria-hidden="true"
          />
          <div
            className={`backdrop-word relative select-none text-[42vw] font-extrabold leading-[0.9] tracking-tighter transition-all duration-500 sm:text-[340px] ${leaving ? "scale-95 opacity-0" : ""}`}
            aria-hidden="true"
          >
            404
          </div>

          {/* Glass bar: the navigation, cut down to a name and an email */}
          <div
            ref={barRef}
            className={`glass-bar absolute left-1/2 top-1/2 z-50 flex w-full max-w-[640px] -translate-x-1/2 -translate-y-1/2 items-center justify-between gap-4 rounded-full py-4 pe-6 ps-6 ${stage === "landed" ? "opacity-0" : ""}`}
          >
            <span className="whitespace-nowrap text-xl font-bold text-gray-800 dark:text-neutral-200">{name}</span>
            {email && (
              <a
                href={`mailto:${email}`}
                className={`truncate text-[15px] text-gray-500 transition-all duration-300 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 ${leaving ? "pointer-events-none opacity-0" : ""}`}
              >
                {email}
              </a>
            )}
          </div>
        </div>

        <h1 className={`mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 sm:mt-10 sm:text-[2.75rem] sm:leading-tight ${fade}`}>
          This page doesn't exist.
        </h1>
        <p className={`mt-3 text-base text-gray-500 dark:text-neutral-400 ${fade}`}>
          {host}
          <span className="break-all font-semibold text-gray-900 dark:text-neutral-100">{location}</span> isn't a real page.
          Did you mean one of these?
        </p>

        <ul className={`mt-4 inline-block text-left ${fade}`}>
          {pages.map((page, i) => (
            <li key={page} className={i > 0 ? "border-t border-black/[0.08] dark:border-white/10" : ""}>
              <a
                href={`/${page}`}
                onClick={(e) => open(e, page)}
                className={`group flex items-center justify-between gap-10 px-1 py-2.5 text-base transition-colors hover:text-gray-900 dark:hover:text-neutral-100 ${
                  page === best ? "font-semibold text-gray-900 dark:text-neutral-100" : "text-gray-500 dark:text-neutral-400"
                }`}
              >
                <span>
                  {host}
                  {page && <span className="font-semibold text-gray-900 dark:text-neutral-100">/{page}</span>}
                </span>
                <ChevronRight className="size-4 text-[#0066cc] transition-transform group-hover:translate-x-0.5 dark:text-[#2997ff]" />
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
