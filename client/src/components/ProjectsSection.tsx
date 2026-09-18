import { Github, ExternalLink, Terminal, Server, BarChart3, Bot, Shield, BookOpen, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

export interface Project {
  id: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  tags?: string[];
}

interface ProjectsSectionProps {
  projects: Project[];
  intro?: string;
}

const categoryGradients: Record<string, string> = {
  "Intelligence & Data Engineering": "from-blue-600 to-cyan-500",
  "Infrastructure & DevOps": "from-orange-500 to-amber-400",
  "Machine Learning & NLP": "from-purple-600 to-pink-500",
  "Machine Learning": "from-violet-600 to-fuchsia-500",
  "Finance Automation": "from-emerald-600 to-teal-400",
  "AI Tools": "from-rose-500 to-orange-400",
  "Developer Tools": "from-gray-600 to-slate-400",
  "DevOps & Governance": "from-red-600 to-rose-400",
  "Education": "from-sky-500 to-indigo-400",
};

const categoryIcons: Record<string, React.ElementType> = {
  "Intelligence & Data Engineering": BarChart3,
  "Infrastructure & DevOps": Server,
  "Machine Learning & NLP": Cpu,
  "Machine Learning": Cpu,
  "Finance Automation": BarChart3,
  "AI Tools": Bot,
  "Developer Tools": Terminal,
  "DevOps & Governance": Shield,
  "Education": BookOpen,
};

export default function ProjectsSection({ projects, intro }: ProjectsSectionProps) {
  return (
    <section
      className="relative mt-10 sm:mt-14 py-8"
      data-testid="section-projects"
      data-section="projects"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-neutral-100">
          Projects
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6">
            {intro}
          </p>
        )}

        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {projects.map((project) => (
              <CarouselItem
                key={project.id}
                className="pl-4 basis-[85%] sm:basis-[48%]"
              >
                <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {project.imageUrl ? (
                      <img
                        src={getOptimizedImageUrl(project.imageUrl)}
                        alt={`Screenshot of ${project.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (() => {
                      const gradient = categoryGradients[project.category || ""] || "from-neutral-600 to-neutral-400";
                      const FallbackIcon = categoryIcons[project.category || ""] || Terminal;
                      return (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                          <FallbackIcon className="size-10 text-white/80" strokeWidth={1.5} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="flex-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {project.description}
                      </p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="px-2 py-0.5 text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 h-7 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Github className="size-3.5" />
                          Code
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 h-7 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <ExternalLink className="size-3.5" />
                          Live
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex items-center justify-end gap-2">
            <CarouselPrevious className="static size-8 translate-y-0" />
            <CarouselNext className="static size-8 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
