import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, Contrast } from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { Link, useLocation } from "wouter";
import { LiquidGlassButton } from "./ui/liquid-glass";
import { useContent } from "@/hooks/use-content";

interface NavigationProps {
  name?: string;
}

export function Navigation({ name = "Portfolio" }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const [highContrast, setHighContrast] = useState(() =>
    document.documentElement.classList.contains("high-contrast")
  );

  const { data } = useContent();
  const socialLinks = (data as any)?.socialLinks as { platform: string; url: string }[] | undefined;
  const github = socialLinks?.find((l) => l.platform === "github")?.url;
  const linkedin = socialLinks?.find((l) => l.platform === "linkedin")?.url;

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for scroll requests after navigation (from hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && location === "/") {
      const sectionId = hash.replace("#", "");
      // Small delay to ensure page is rendered
      setTimeout(() => {
        const element = document.querySelector(`[data-section="${sectionId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          window.dispatchEvent(new CustomEvent("nav-scroll", { detail: sectionId }));
        }
        // Clear the hash after scrolling
        window.history.replaceState(null, "", "/");
      }, 100);
    }
  }, [location]);

  const scrollToSection = (id: string) => {
    // Check if we're on the home page
    if (location !== "/") {
      // Navigate to home with hash, the useEffect above will handle scrolling
      setLocation(`/#${id}`);
      // Also set the actual browser hash for the useEffect to pick up
      window.location.hash = id;
    } else {
      // Already on home page, just scroll
      const element = document.querySelector(`[data-section="${id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("nav-scroll", { detail: id }));
      }
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full text-sm">
      <div
        className={`glass-bar mt-4 w-full max-w-4xl mx-2 sm:mx-auto rounded-[28px] md:rounded-full transition-shadow duration-300 ${isScrolled ? "glass-bar-raised" : ""}`}
      >
        <nav className="w-full flex flex-wrap md:flex-nowrap items-center justify-between p-1.5 ps-6 md:py-1 relative">
        <div className="flex items-center">
          <Link href="/">
            <span
              className="flex-none rounded-md text-xl inline-block font-bold whitespace-nowrap focus:outline-none focus:opacity-80 text-gray-800 dark:text-neutral-200 cursor-pointer"
              aria-label={name}
            >
              {name}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:order-4 md:ms-4">
          {/* Liquid Glass Contact Button */}
          <LiquidGlassButton
            onClick={() => scrollToSection("contact")}
            size="sm"
            className="rounded-full"
          >
            Contact
          </LiquidGlassButton>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex justify-center items-center size-9 border border-gray-200 text-gray-500 rounded-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              {isOpen ? (
                <X className="shrink-0 size-4" />
              ) : (
                <Menu className="shrink-0 size-4" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`${isOpen ? "block" : "hidden"
            } overflow-hidden transition-all duration-300 basis-full grow md:block`}
        >
          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-end gap-2 md:gap-3 mt-3 md:mt-0 py-2 md:py-0 md:ps-7">
            <Link href="/gallery">
              <span
                className="py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer block text-center"
                onClick={() => setIsOpen(false)}
              >
                Gallery
              </span>
            </Link>
            <Link href="/news">
              <span
                className="py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer block text-center"
                onClick={() => setIsOpen(false)}
              >
                News
              </span>
            </Link>

            <div className="flex items-center gap-3 mt-2 md:mt-0 md:ms-2">
              <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-neutral-600" />
              {github && (
                <a
                  className="inline-block text-[#181717] hover:text-black focus:outline-none dark:text-neutral-300 dark:hover:text-white transition-colors"
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <FaGithub className="shrink-0 size-4" />
                </a>
              )}
              {linkedin && (
                <a
                  className="inline-block text-[#0A66C2] hover:text-[#004182] focus:outline-none dark:text-[#0A66C2] dark:hover:text-[#5eb1ff] transition-colors"
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn className="shrink-0 size-4" />
                </a>
              )}

              <div className="w-px h-4 bg-gray-300 dark:bg-neutral-600" />

              <LiquidGlassButton
                onClick={toggleTheme}
                size="icon"
                className="rounded-full size-8"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
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
        </nav>
      </div>
    </header>
  );
}
