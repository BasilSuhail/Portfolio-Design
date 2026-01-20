import { Link } from "wouter";
import { Search } from "lucide-react";

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
    <section className="mt-10 sm:mt-14" data-testid="section-projects" data-section="projects">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 font-medium text-gray-800 dark:text-neutral-200">
          Projects
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Image Grid - Preline Style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group block relative overflow-hidden rounded-lg"
              data-testid={`card-project-${project.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <img
                className="w-full size-40 object-cover bg-gray-100 rounded-lg dark:bg-neutral-800 transition-transform duration-300 group-hover:scale-105"
                src={project.imageUrl}
                alt={project.title}
              />
              <div className="absolute bottom-1 end-1 opacity-0 group-hover:opacity-100 transition">
                <div className="flex items-center gap-x-1 py-1 px-2 bg-white border border-gray-200 text-gray-800 rounded-lg dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200">
                  <Search className="shrink-0 size-3" />
                  <span className="text-xs">View</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
