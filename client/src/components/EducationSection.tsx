import { useState } from "react";
import { Circle, ChevronDown, ChevronUp } from "lucide-react";

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
  // Track expanded state for each education item (all collapsed by default)
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
    <section className="py-8 pt-4" data-testid="section-education">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            EDUCATION
          </span>
          {intro && <p className="text-foreground/80 leading-relaxed">{intro}</p>}
        </div>

        <div className="space-y-8">
          {education.map((edu) => {
            const isExpanded = expandedItems.has(edu.id);
            return (
              <div
                key={edu.id}
                className="grid grid-cols-[120px_1fr] gap-6"
                data-testid={`education-item-${edu.id}`}
              >
                <div className="text-sm text-muted-foreground font-mono">
                  {edu.dateRange}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex flex-col">
                      <span className="font-medium">{edu.degree}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {edu.institutionLogoUrl ? (
                          <img
                            src={edu.institutionLogoUrl}
                            alt={`${edu.institution} logo`}
                            className="w-5 h-5 object-contain rounded"
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4"
                            style={{ fill: edu.institutionColor || "#666", color: edu.institutionColor || "#666" }}
                          />
                        )}
                        <span className="text-sm text-muted-foreground">{edu.institution}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(edu.id)}
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
                      {edu.coursework && (
                        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                          {edu.coursework}
                        </p>
                      )}

                      {edu.customSections && edu.customSections.map((section, sectionIdx) => (
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

                      {edu.achievements && edu.achievements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{achievementsLabel}</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                            {edu.achievements.map((achievement, idx) => (
                              <li key={idx}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {edu.certifications && edu.certifications.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{certificationsLabel}</p>
                          <ul className="space-y-1">
                            {edu.certifications.map((cert, idx) => (
                              <li key={idx} className="text-sm">
                                {cert.url ? (
                                  <a
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground/70 hover:text-foreground transition-colors underline"
                                  >
                                    {cert.name}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{cert.name}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
