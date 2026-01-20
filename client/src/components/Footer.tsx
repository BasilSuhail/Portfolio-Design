import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Moon, Sun, Contrast } from "lucide-react";
import { useEffect, useState } from "react";
import { LiquidGlassButton } from "./ui/liquid-glass";

interface FooterProps {
  name?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function Footer({ name = "Portfolio", socialLinks }: FooterProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedContrast = localStorage.getItem("highContrast") === "true";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    setHighContrast(savedContrast);
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
    <footer className="mt-16 mb-10">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-neutral-400">
                © {new Date().getFullYear()} {name}. All rights reserved.
              </p>
            </div>

            {/* Social Links + Theme Toggles */}
            <div className="flex items-center gap-3">
              {/* Social Links */}
              {socialLinks?.github && (
                <a
                  className="inline-block text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-200"
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <FaGithub className="shrink-0 size-4" />
                </a>
              )}
              {socialLinks?.linkedin && (
                <a
                  className="inline-block text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-200"
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn className="shrink-0 size-4" />
                </a>
              )}
              {socialLinks?.twitter && (
                <a
                  className="inline-block text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-200"
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <FaXTwitter className="shrink-0 size-4" />
                </a>
              )}

              {/* Divider */}
              <div className="w-px h-4 bg-gray-300 dark:bg-neutral-600" />

              {/* Theme Toggle Buttons - Liquid Glass Style */}
              <LiquidGlassButton
                onClick={toggleTheme}
                size="icon"
                className="rounded-full size-8"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="size-3.5" />
                ) : (
                  <Sun className="size-3.5" />
                )}
              </LiquidGlassButton>

              <LiquidGlassButton
                onClick={toggleHighContrast}
                size="icon"
                className={`rounded-full size-8 ${highContrast ? "bg-white/40" : ""}`}
                aria-label="Toggle high contrast"
              >
                <Contrast className="size-3.5" />
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
