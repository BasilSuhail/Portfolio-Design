import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Snowflake } from "lucide-react";

// The snow and lights are only downloaded once the mode is switched on.
const HolidayScene = lazy(() => import("./holiday/HolidayScene"));

const STORAGE_KEY = "holidayMode";
const WAS_DARK_KEY = "holidayWasDark";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the mode still works for this visit.
  }
}

/**
 * Corner switch for holiday mode: snowfall, settled snow and strings of lights.
 * It is a night scene, so it always runs in dark mode and hands the old theme back afterwards.
 */
export function HolidayMode() {
  const [on, setOn] = useState(() => read(STORAGE_KEY) === "true");
  // A visitor returning with the mode already on gets the page first and the snow a moment later.
  const [wanted, setWanted] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!on) {
      setWanted(false);
      setReady(false);
      return;
    }
    if (wanted) return;
    const start = () => setWanted(true);
    if (document.readyState === "complete") {
      const timer = setTimeout(start, 600);
      return () => clearTimeout(timer);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, [on, wanted]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("holiday", on);
    write(STORAGE_KEY, String(on));
    if (!on) return;

    root.classList.add("dark");
    // Switching back to the light theme ends holiday mode.
    const observer = new MutationObserver(() => {
      if (!root.classList.contains("dark")) setOn(false);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [on]);

  const toggle = () => {
    const root = document.documentElement;
    if (!on) {
      write(WAS_DARK_KEY, String(root.classList.contains("dark")));
      setOn(true);
      setWanted(true); // asked for by hand: fetch it straight away
    } else {
      setOn(false);
      if (read(WAS_DARK_KEY) === "false") root.classList.remove("dark");
    }
  };

  return (
    <>
      {on && wanted && (
        <Suspense fallback={null}>
          <HolidayScene onReady={onReady} />
        </Suspense>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Switch off holiday mode" : "Switch to holiday mode"}
        aria-busy={on && !ready}
        className="glass-bar fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full p-2.5 text-xs font-medium text-gray-700 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-neutral-200 min-[1080px]:bottom-auto min-[1080px]:top-[26px] min-[1440px]:px-3.5 min-[1440px]:py-2"
        data-testid="button-holiday-mode"
      >
        <Snowflake className={`size-4 ${on ? "text-sky-400" : ""} ${on && !ready ? "animate-spin" : ""}`} />
        <span className="hidden min-[1440px]:inline">
          {!on ? "Switch to holiday mode" : ready ? "Holiday mode on" : "Bringing the snow"}
        </span>
        {/* The same loading bar as the full-page loader, tucked along the bottom of the pill */}
        {on && !ready && (
          <span className="site-loader-track !absolute inset-x-3 bottom-1 !h-0.5 !w-auto">
            <span className="site-loader-fill" />
          </span>
        )}
      </button>
    </>
  );
}
