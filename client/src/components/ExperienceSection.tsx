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
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            EXPERIENCE
          </span>
          <p className="text-foreground/80 leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-8">
          {experiences.map((exp) => {
            const isExpanded = expandedItems.has(exp.id);
            return (
              <div
                key={exp.id}
                className="grid grid-cols-[120px_1fr] gap-6"
                data-testid={`experience-item-${exp.id}`}
              >
                <div className="text-sm text-muted-foreground font-mono">
                  {exp.dateRange}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex flex-col">
                      <span className="font-medium">{exp.role}</span>
                      <div className="flex items-center gap-1.5 mt-1">
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
                        <span className="text-sm text-muted-foreground">{exp.company}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(exp.id)}
                      className="p-1 hover:bg-muted rounded transition-colors self-start"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2">
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>

                      {exp.customSections && exp.customSections.map((section, sectionIdx) => (
                        <div key={sectionIdx} className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{section.label}</p>
                          <ul className="space-y-1">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-sm">
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground/70 hover:text-foreground transition-colors underline"
                                  >
                                    {item.name}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{item.name}</span>
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
