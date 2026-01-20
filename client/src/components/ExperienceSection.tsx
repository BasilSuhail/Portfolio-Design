import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface Experience {
  id: string;
  dateRange: string;
  role: string;
  company: string;
  companyLogoUrl?: string;
  companyColor?: string;
  description: string;
  customSections?: Array<{
    label: string;
    items: Array<{
      name: string;
      url?: string;
    }>;
  }>;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  intro?: string;
}

export default function ExperienceSection({
  experiences,
  intro,
}: ExperienceSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [wasExpandedByNav, setWasExpandedByNav] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Listen for nav click to expand all items
  useEffect(() => {
    const handleNavScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === "experience") {
        // Expand all items when nav link is clicked
        const allIds = new Set(experiences.map((exp) => exp.id));
        setExpandedItems(allIds);
        setWasExpandedByNav(true);
      }
    };

    window.addEventListener("nav-scroll", handleNavScroll);
    return () => window.removeEventListener("nav-scroll", handleNavScroll);
  }, [experiences]);

  // Collapse when scrolling away (only if was expanded by nav)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && wasExpandedByNav) {
            // Collapse all when scrolling away
            setExpandedItems(new Set());
            setWasExpandedByNav(false);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "-100px 0px -100px 0px",
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [wasExpandedByNav]);

  // Toggle individual item
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <section ref={sectionRef} className="mt-10 sm:mt-14" data-testid="section-experience" data-section="experience">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 font-medium text-gray-800 dark:text-neutral-200">
          Work experience
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Timeline - Preline Style */}
        <div>
          {experiences.map((exp, index) => {
            const isExpanded = expandedItems.has(exp.id);
            const isLast = index === experiences.length - 1;

            return (
              <div key={exp.id} className="group relative flex gap-x-5" data-testid={`experience-item-${exp.id}`}>
                {/* Timeline Line & Icon */}
                <div className={`relative ${isLast ? "" : "after:absolute after:top-8 after:bottom-2 after:start-3 after:w-px after:-translate-x-[0.5px] after:bg-gray-200 dark:after:bg-neutral-700"}`}>
                  <div className="relative z-10 size-6 flex justify-center items-center">
                    {exp.companyLogoUrl ? (
                      <img
                        src={exp.companyLogoUrl}
                        alt={`${exp.company} logo`}
                        className="shrink-0 size-6 rounded-full object-contain bg-white dark:bg-neutral-800 ring-1 ring-gray-200 dark:ring-neutral-700"
                      />
                    ) : (
                      <div
                        className="size-6 rounded-full"
                        style={{ backgroundColor: exp.companyColor || '#6b7280' }}
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="grow pb-8">
                  <button
                    onClick={() => toggleExpand(exp.id)}
                    className="w-full text-left group/item"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                        {exp.role}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-neutral-300" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-neutral-300" />
                      )}
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-neutral-500">
                      {exp.company}
                    </p>

                    <p className="mt-1 text-xs text-gray-400 dark:text-neutral-600">
                      {exp.dateRange}
                    </p>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                        {exp.description}
                      </p>

                      {exp.customSections && exp.customSections.map((section, sectionIdx) => (
                        <div key={sectionIdx} className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide mb-2">
                            {section.label}
                          </p>
                          <ul className="space-y-1">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-sm text-gray-600 dark:text-neutral-400 flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-gray-800 dark:hover:text-neutral-200"
                                  >
                                    {item.name}
                                  </a>
                                ) : (
                                  <span>{item.name}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
