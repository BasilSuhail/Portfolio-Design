import { useState } from "react";
import { Circle, ChevronDown, ChevronUp } from "lucide-react";

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
  intro = "Throughout my career, I've worked on various projects, from building scalable systems to designing user-friendly interfaces. Here's a brief overview.",
}: ExperienceSectionProps) {
  // Track expanded state for each experience (all collapsed by default)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    <section className="py-16 pb-8" data-testid="section-experience">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            EXPERIENCE
          </span>
          <p className="text-foreground/80 leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-6">
          {experiences.map((exp) => {
            const isExpanded = expandedItems.has(exp.id);
            return (
              <div
                key={exp.id}
                className="group relative"
                data-testid={`experience-item-${exp.id}`}
              >
                {/* Clickable Header Area */}
                <div
                  onClick={() => toggleExpand(exp.id)}
                  className="cursor-pointer hover:bg-muted/30 -mx-3 px-3 py-3 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    {/* Left: Date (smaller, subtle) */}
                    <div className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
                      {exp.dateRange}
                    </div>

                    {/* Right: Chevron */}
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
                      )}
                    </div>
                  </div>

                  {/* Role and Company */}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-lg text-foreground">{exp.role}</h3>
                    <div className="flex items-center gap-2">
                      {exp.companyLogoUrl ? (
                        <img
                          src={exp.companyLogoUrl}
                          alt={`${exp.company} logo`}
                          className="w-5 h-5 object-contain rounded"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4"
                          style={{ fill: exp.companyColor || "#666", color: exp.companyColor || "#666" }}
                        />
                      )}
                      <span className="text-sm text-muted-foreground font-medium">{exp.company}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Full Width */}
                {isExpanded && (
                  <div className="mt-3 px-3 pb-2">
                    <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line mb-4">
                      {exp.description}
                    </p>

                    {exp.customSections && exp.customSections.map((section, sectionIdx) => (
                      <div key={sectionIdx} className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {section.label}
                        </p>
                        <ul className="space-y-1.5">
                          {section.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm flex items-start">
                              <span className="text-muted-foreground mr-2">•</span>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-foreground/80 hover:text-primary transition-colors underline"
                                >
                                  {item.name}
                                </a>
                              ) : (
                                <span className="text-foreground/80">{item.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Border */}
                {!isExpanded && <div className="h-px bg-border mt-3" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
