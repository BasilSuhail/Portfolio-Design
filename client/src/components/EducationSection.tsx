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
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            EDUCATION
          </span>
          {intro && <p className="text-foreground/80 leading-relaxed">{intro}</p>}
        </div>

        <div className="space-y-6">
          {education.map((edu) => {
            const isExpanded = expandedItems.has(edu.id);
            return (
              <div
                key={edu.id}
                className="group relative"
                data-testid={`education-item-${edu.id}`}
              >
                {/* Clickable Header Area */}
                <div
                  onClick={() => toggleExpand(edu.id)}
                  className="cursor-pointer hover:bg-muted/30 -mx-3 px-3 py-3 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    {/* Left: Date (smaller, subtle) */}
                    <div className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
                      {edu.dateRange}
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

                  {/* Degree and Institution */}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-lg text-foreground">{edu.degree}</h3>
                    <div className="flex items-center gap-2">
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
                      <span className="text-sm text-muted-foreground font-medium">{edu.institution}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Full Width */}
                {isExpanded && (
                  <div className="mt-3 px-3 pb-2">
                    {edu.coursework && (
                      <p className="text-foreground/90 text-sm leading-relaxed mb-4">
                        {edu.coursework}
                      </p>
                    )}

                    {edu.customSections && edu.customSections.map((section, sectionIdx) => (
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

                    {edu.achievements && edu.achievements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {achievementsLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {edu.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-sm flex items-start">
                              <span className="text-muted-foreground mr-2">•</span>
                              <span className="text-foreground/80">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {edu.certifications && edu.certifications.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {certificationsLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {edu.certifications.map((cert, idx) => (
                            <li key={idx} className="text-sm flex items-start">
                              <span className="text-muted-foreground mr-2">•</span>
                              {cert.url ? (
                                <a
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-foreground/80 hover:text-primary transition-colors underline"
                                >
                                  {cert.name}
                                </a>
                              ) : (
                                <span className="text-foreground/80">{cert.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
