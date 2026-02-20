import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TocSection {
  id: string;
  label: string;
  badge?: string;
  preview?: string; // short text shown collapsed
  subItems?: string[]; // sub-items shown when expanded
}

interface TerminalTOCProps {
  sections: TocSection[];
  expandedIds: Set<string>;
  onScrollTo: (id: string) => void;
}

// ─────────────────────────────────────────────
// Terminal Table of Contents (left sidebar)
// ─────────────────────────────────────────────

export function TerminalTOC({ sections, expandedIds, onScrollTo }: TerminalTOCProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track active section via scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const viewportCenter = window.scrollY + window.innerHeight * 0.3;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (window.scrollY / maxScroll > 0.9) {
        setActiveId(sections[sections.length - 1]?.id || "");
        return;
      }

      // Walk sections from bottom to top
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.querySelector(`[data-toc-id="${sections[i].id}"]`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (viewportCenter >= top) {
            setActiveId(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-toc-id="${id}"]`);
    if (!el) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isScrollingRef.current = true;
    setActiveId(id);
    onScrollTo(id); // let parent know to expand if needed

    const targetY = window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.15;
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });

    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block w-[140px]">
      <div className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          const isExpanded = expandedIds.has(section.id);

          return (
            <div key={section.id}>
              {/* Section row */}
              <button
                onClick={() => scrollTo(section.id)}
                className={`
                  w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-150 group
                  ${isActive
                    ? "bg-gray-100 dark:bg-neutral-800"
                    : "hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                  }
                `}
              >
                {/* Active pip */}
                <span
                  className={`flex-shrink-0 w-1 h-1 rounded-full transition-all duration-200 ${isActive ? "bg-violet-500 scale-125" : "bg-gray-300 dark:bg-neutral-600"
                    }`}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-[11px] leading-tight truncate transition-colors ${isActive
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300"
                      }`}
                  >
                    {section.label}
                  </span>
                  {section.badge && (
                    <span className="block text-[9px] text-violet-400 leading-tight truncate mt-0.5">
                      {section.badge}
                    </span>
                  )}
                </div>
              </button>

              {/* Sub-items — shown when section is expanded */}
              {isExpanded && section.subItems && section.subItems.length > 0 && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 dark:border-neutral-700 pl-2">
                  {section.subItems.map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-gray-400 dark:text-neutral-500 leading-tight py-0.5 truncate"
                      title={item}
                    >
                      {item.length > 22 ? item.slice(0, 22) + "…" : item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Keep legacy ScrollIndicator working for other pages
// ─────────────────────────────────────────────

interface LegacySection {
  id: string;
  label: string;
}

const homeSections: LegacySection[] = [
  { id: "hero", label: "Bio" },
  { id: "projects", label: "Projects" },
  { id: "journey", label: "Journey" },
  { id: "techStack", label: "Tech" },
  { id: "testimonials", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export function ScrollIndicator({ sections = homeSections }: { sections?: LegacySection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id || "hero");
  const [displaySections, setDisplaySections] = useState<LegacySection[]>([]);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const existing = sections.filter(s =>
      document.querySelector(`[data-section="${s.id}"]`)
    );
    setDisplaySections(existing);
  }, [sections]);

  useEffect(() => {
    if (displaySections.length === 0) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const viewportCenter = window.scrollY + window.innerHeight * 0.35;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = window.scrollY / maxScroll;

      if (scrollPercent > 0.85) {
        setActiveId(displaySections[displaySections.length - 1].id);
        return;
      }
      if (window.scrollY < 50) {
        setActiveId(displaySections[0].id);
        return;
      }
      for (let i = displaySections.length - 1; i >= 0; i--) {
        const section = document.querySelector(`[data-section="${displaySections[i].id}"]`);
        if (section) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          if (viewportCenter >= sectionTop) {
            setActiveId(displaySections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displaySections, sections]);

  useEffect(() => {
    return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); };
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.querySelector(`[data-section="${id}"]`);
    if (section) {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      isScrollingRef.current = true;
      const rect = section.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - window.innerHeight * 0.2;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
      setActiveId(id);
      scrollTimeoutRef.current = setTimeout(() => { isScrollingRef.current = false; }, 900);
    }
  };

  if (displaySections.length === 0) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block w-[140px]">
      <div className="flex flex-col gap-0.5">
        {displaySections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-150 group
                ${isActive
                  ? "bg-gray-100 dark:bg-neutral-800"
                  : "hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                }
              `}
            >
              {/* Active pip */}
              <span
                className={`flex-shrink-0 w-1 h-1 rounded-full transition-all duration-200 ${isActive ? "bg-violet-500 scale-125" : "bg-gray-300 dark:bg-neutral-600"
                  }`}
              />
              <span
                className={`text-[11px] leading-tight truncate transition-colors ${isActive
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300"
                  }`}
              >
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

