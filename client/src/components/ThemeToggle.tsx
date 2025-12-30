import { Moon, Sun, Contrast } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedContrast = localStorage.getItem("highContrast") === "true";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    setHighContrast(savedContrast);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.classList.toggle("high-contrast", savedContrast);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleHighContrast = () => {
    const newContrast = !highContrast;
    setHighContrast(newContrast);
    localStorage.setItem("highContrast", String(newContrast));
    document.documentElement.classList.toggle("high-contrast", newContrast);
  };

  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-all whitespace-nowrap"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <>
            <Moon className="h-4 w-4" />
            <span className="text-sm font-medium">Dark</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span className="text-sm font-medium">Light</span>
          </>
        )}
      </button>

      <button
        onClick={toggleHighContrast}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm hover:shadow-md transition-all whitespace-nowrap ${
          highContrast
            ? "bg-foreground text-background border-foreground"
            : "bg-background text-foreground border-border"
        }`}
        aria-label="Toggle high contrast"
      >
        <Contrast className="h-4 w-4" />
        <span className="text-sm font-medium">High Contrast</span>
      </button>
    </div>
  );
}
