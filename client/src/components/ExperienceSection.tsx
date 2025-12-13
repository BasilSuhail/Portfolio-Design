import { Circle } from "lucide-react";

export interface Experience {
  id: string;
  dateRange: string;
  role: string;
  company: string;
  companyLogoUrl?: string;
  companyColor?: string;
  description: string;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  intro?: string;
}

export default function ExperienceSection({
  experiences,
  intro = "Throughout my career, I've worked on various projects, from building scalable systems to designing user-friendly interfaces. Here's a brief overview.",
}: ExperienceSectionProps) {
  return (
    <section className="py-16" data-testid="section-experience">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            EXPERIENCE
          </span>
          <p className="text-foreground/80 leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-8">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="grid grid-cols-[120px_1fr] gap-6"
              data-testid={`experience-item-${exp.id}`}
            >
              <div className="text-sm text-muted-foreground font-mono">
                {exp.dateRange}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{exp.role} at</span>
                  <div className="flex items-center gap-1.5">
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
                    <span className="font-medium">{exp.company}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
