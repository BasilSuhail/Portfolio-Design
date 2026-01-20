import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "wouter";

interface NavigationProps {
  name?: string;
}

export function Navigation({ name = "Portfolio" }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(`[data-section="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Dispatch custom event to notify section to expand
      window.dispatchEvent(new CustomEvent("nav-scroll", { detail: id }));
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full text-sm">
      <nav
        className={`mt-4 relative max-w-3xl w-full bg-white/80 backdrop-blur-md border border-gray-200 rounded-[24px] mx-2 flex flex-wrap md:flex-nowrap items-center justify-between p-1 ps-4 md:py-0 sm:mx-auto transition-shadow duration-300 dark:bg-neutral-900/80 dark:border-neutral-700 ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        <div className="flex items-center">
          <Link href="/">
            <span
              className="flex-none rounded-md text-xl inline-block font-semibold focus:outline-none focus:opacity-80 text-gray-800 dark:text-neutral-200 cursor-pointer"
              aria-label={name}
            >
              {name.split(" ")[0]}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:order-4 md:ms-4">
          {/* Metal Contact Button */}
          <button
            onClick={() => scrollToSection("contact")}
            className="relative inline-flex transform-gpu rounded-full p-[1px] will-change-transform bg-gradient-to-b from-[#000] to-[#A0A0A0] dark:from-[#333] dark:to-[#666] hover:shadow-md transition-shadow"
          >
            <span className="absolute inset-[1px] transform-gpu rounded-full will-change-transform bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]" />
            <span className="relative z-10 m-[2px] inline-flex transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#B9B9B9] to-[#969696] text-white px-4 py-1.5 text-sm font-medium">
              Contact
            </span>
          </button>

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
          className={`${
            isOpen ? "block" : "hidden"
          } overflow-hidden transition-all duration-300 basis-full grow md:block`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3 mt-3 md:mt-0 py-2 md:py-0 md:ps-7">
            <button
              onClick={() => scrollToSection("projects")}
              className="py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Work
            </button>
            <button
              onClick={() => scrollToSection("experience")}
              className="py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Experience
            </button>
            <Link href="/news">
              <span
                className="py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer block"
                onClick={() => setIsOpen(false)}
              >
                News
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
