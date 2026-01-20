import { useState, useEffect, useRef } from "react";
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react";

export interface Education {
  id: string;
  dateRange: string;
  degree: string;
  institution: string;
  institutionLogoUrl?: string;
  institutionColor?: string;
  coursework?: string;
  customSections?: Array<{
    label: string;
    items: Array<{
      name: string;
      url?: string;
    }>;
  }>;
  certifications?: Array<{
    name: string;
    url?: string;
  }>;
  achievements?: string[];
}

interface EducationSectionProps {
  education: Education[];
  intro?: string;
  achievementsLabel?: string;
  certificationsLabel?: string;
}

export default function EducationSection({
  education,
  intro,
  achievementsLabel = "Achievements:",
  certificationsLabel = "Certifications:",
}: EducationSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [wasExpandedByNav, setWasExpandedByNav] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Listen for nav click to expand all items
  useEffect(() => {
    const handleNavScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === "education") {
        // Expand all items when nav link is clicked
        const allIds = new Set(education.map((edu) => edu.id));
        setExpandedItems(allIds);
        setWasExpandedByNav(true);
      }
    };

    window.addEventListener("nav-scroll", handleNavScroll);
    return () => window.removeEventListener("nav-scroll", handleNavScroll);
  }, [education]);

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

  // Toggle all items together
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const isExpanded = prev.has(id);
      if (isExpanded) {
        // If clicked item is expanded, collapse all
        return new Set();
      } else {
        // If clicked item is collapsed, expand all
        return new Set(education.map((edu) => edu.id));
      }
    });
  };

  return (
    <section ref={sectionRef} className="mt-10 sm:mt-14" data-testid="section-education" data-section="education">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 font-medium text-gray-800 dark:text-neutral-200">
          Education
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Grid - Preline Style with Collapsible Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {education.map((edu) => {
            const isExpanded = expandedItems.has(edu.id);
            const hasExpandableContent =
              edu.coursework ||
              (edu.customSections && edu.customSections.length > 0) ||
              (edu.achievements && edu.achievements.length > 0) ||
              (edu.certifications && edu.certifications.length > 0);

            return (
              <div
                key={edu.id}
                className="border border-gray-200 rounded-lg dark:border-neutral-700 overflow-hidden"
                data-testid={`education-item-${edu.id}`}
              >
                {/* Header - Always Visible */}
                <button
                  onClick={() => hasExpandableContent && toggleExpand(edu.id)}
                  className={`w-full p-4 text-left ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!hasExpandableContent}
                >
                  <div className="flex items-center gap-x-3">
                    {edu.institutionLogoUrl ? (
                      <img
                        src={edu.institutionLogoUrl}
                        alt={`${edu.institution} logo`}
                        className="shrink-0 size-10 rounded-full object-contain bg-white dark:bg-neutral-800"
                      />
                    ) : (
                      <div
                        className="shrink-0 size-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: edu.institutionColor || '#6b7280' }}
                      >
                        <GraduationCap className="size-5 text-white" />
                      </div>
                    )}
                    <div className="grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                            {edu.degree}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-500">
                            {edu.institution}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-neutral-600 mt-0.5">
                            {edu.dateRange}
                          </p>
                        </div>
                        {hasExpandableContent && (
                          <div className="shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expandable Content */}
                {isExpanded && hasExpandableContent && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-neutral-800">
                    <div className="pt-3 space-y-3">
                      {edu.coursework && (
                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                          {edu.coursework}
                        </p>
                      )}

                      {/* Achievements */}
                      {edu.achievements && edu.achievements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide mb-1">
                            {achievementsLabel}
                          </p>
                          <ul className="space-y-1">
                            {edu.achievements.map((achievement, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-neutral-400 flex items-start">
                                <span className="text-gray-400 mr-1.5">•</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Custom Sections */}
                      {edu.customSections && edu.customSections.map((section, sectionIdx) => (
                        <div key={sectionIdx}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide mb-1">
                            {section.label}
                          </p>
                          <ul className="space-y-1">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-xs text-gray-600 dark:text-neutral-400 flex items-start">
                                <span className="text-gray-400 mr-1.5">•</span>
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

                      {/* Certifications */}
                      {edu.certifications && edu.certifications.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide mb-1">
                            {certificationsLabel}
                          </p>
                          <ul className="space-y-1">
                            {edu.certifications.map((cert, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-neutral-400 flex items-start">
                                <span className="text-gray-400 mr-1.5">•</span>
                                {cert.url ? (
                                  <a
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-gray-800 dark:hover:text-neutral-200"
                                  >
                                    {cert.name}
                                  </a>
                                ) : (
                                  <span>{cert.name}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
