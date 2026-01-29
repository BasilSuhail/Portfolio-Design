import { useEffect, useState, useRef } from "react";

interface Section {
  id: string;
  label: string;
}

const allSections: Section[] = [
  { id: "hero", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "journey", label: "Journey" },
  { id: "techStack", label: "Tech" },
  { id: "testimonials", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export function ScrollIndicator() {
  const [activeId, setActiveId] = useState("hero");
  const [displaySections, setDisplaySections] = useState<Section[]>([]);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find which sections exist on the page
  useEffect(() => {
    const existing = allSections.filter(s =>
      document.querySelector(`[data-section="${s.id}"]`)
    );
    setDisplaySections(existing);
  }, []);

  // Track scroll position
  useEffect(() => {
    if (displaySections.length === 0) return;

    const handleScroll = () => {
      // Skip scroll detection during programmatic scrolling
      if (isScrollingRef.current) return;

      const viewportCenter = window.scrollY + window.innerHeight * 0.35;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = window.scrollY / maxScroll;

      // If near bottom of page, select last section
      if (scrollPercent > 0.85) {
        setActiveId(displaySections[displaySections.length - 1].id);
        return;
      }

      // If at top, select first section
      if (window.scrollY < 50) {
        setActiveId(displaySections[0].id);
        return;
      }

      // Find current section by checking each one (from bottom to top)
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
  }, [displaySections]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.querySelector(`[data-section="${id}"]`);
    if (section) {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Lock scroll detection during programmatic scroll
      isScrollingRef.current = true;

      const rect = section.getBoundingClientRect();
      // Position section at 20% from viewport top - ensures it's above the 35% detection point
      const targetY = window.scrollY + rect.top - window.innerHeight * 0.2;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth"
      });

      // Immediately set active for instant feedback
      setActiveId(id);

      // Re-enable scroll detection after animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 900);
    }
  };

  if (displaySections.length === 0) return null;

  // Find active index for indicator position
  const activeIndex = displaySections.findIndex(s => s.id === activeId);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const itemHeight = 28;
  const indicatorHeight = 20;
  const trackPadding = 4;
  const trackHeight = (displaySections.length - 1) * itemHeight + indicatorHeight + trackPadding * 2;

  return (
    <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50 hidden lg:flex items-center gap-4">
      {/* Glass slider track */}
      <div
        className="relative backdrop-blur-md bg-gray-200/40 dark:bg-neutral-700/30 rounded-full"
        style={{ width: "12px", height: `${trackHeight}px` }}
      >
        {/* Moving indicator - ultra smooth gentle slide */}
        <div
          className="absolute left-[2px] w-[8px] bg-gray-600 dark:bg-white rounded-full"
          style={{
            height: `${indicatorHeight}px`,
            top: `${trackPadding + safeActiveIndex * itemHeight}px`,
            transition: "top 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        />
      </div>

      {/* Section labels */}
      <div className="flex flex-col" style={{ gap: `${itemHeight - 16}px` }}>
        {displaySections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`
              text-left text-[11px] transition-all duration-200 leading-none py-1
              ${activeId === section.id
                ? "text-gray-800 dark:text-white font-medium"
                : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
              }
            `}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
