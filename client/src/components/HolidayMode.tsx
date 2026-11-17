import { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { Snowfall } from "./holiday/Snowfall";
import { HolidayDecor } from "./holiday/HolidayDecor";

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
    } else {
      setOn(false);
      if (read(WAS_DARK_KEY) === "false") root.classList.remove("dark");
    }
  };

  return (
    <>
      {on && <HolidayDecor />}
      {on && <Snowfall />}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Switch off holiday mode" : "Switch to holiday mode"}
        className="glass-bar fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full p-2.5 text-xs font-medium text-gray-700 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-neutral-200 min-[1080px]:bottom-auto min-[1080px]:top-[26px] min-[1440px]:px-3.5 min-[1440px]:py-2"
        data-testid="button-holiday-mode"
      >
        <Snowflake className={`size-4 ${on ? "text-sky-400" : ""}`} />
        <span className="hidden min-[1440px]:inline">{on ? "Holiday mode on" : "Switch to holiday mode"}</span>
      </button>
    </>
  );
}
