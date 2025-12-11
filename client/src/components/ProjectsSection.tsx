import ProjectCard from "./ProjectCard";
import { Briefcase, Monitor, Layout, Code, Smartphone, Mail, Zap, Grid3X3, Pencil } from "lucide-react";

export interface Project {
  id: string;
  title: string;
  imageUrl: string;
}

interface ProjectsSectionProps {
  projects: Project[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const iconClasses = "w-5 h-5 text-muted-foreground";

  return (
    <section className="py-16" data-testid="section-projects">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            WORK
          </span>
          <p className="text-foreground/80">
            Below are some select projects, full walkthroughs on request
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              imageUrl={project.imageUrl}
              rotation={index % 2 === 0 ? -2 : 2}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-8">
          <Briefcase className={iconClasses} />
          <Monitor className={iconClasses} />
          <Layout className={iconClasses} />
          <Code className={iconClasses} />
          <Grid3X3 className={iconClasses} />
          <Smartphone className={iconClasses} />
          <Pencil className={iconClasses} />
          <Zap className={iconClasses} />
          <Mail className={iconClasses} />
        </div>
      </div>
    </section>
  );
}
