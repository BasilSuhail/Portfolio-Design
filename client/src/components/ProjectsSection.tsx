import ProjectCard from "./ProjectCard";

export interface Project {
  id: string;
  title: string;
  imageUrl: string;
}

interface ProjectsSectionProps {
  projects: Project[];
  intro?: string;
}

export default function ProjectsSection({ projects, intro }: ProjectsSectionProps) {
  return (
    <section className="py-16" data-testid="section-projects">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            WORK
          </span>
          {intro && (
            <p className="text-foreground/80">
              {intro}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              imageUrl={project.imageUrl}
              rotation={index % 2 === 0 ? -2 : 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
