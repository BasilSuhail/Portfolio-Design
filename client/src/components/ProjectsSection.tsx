import { useState } from "react";
import { Github, ExternalLink, Terminal, Server, BarChart3, Bot, Shield, BookOpen, Cpu, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { getThumbnailUrl } from "@/lib/imageUtils";
import GithubActivity from "./GithubActivity";

export interface Project {
  id: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  tags?: string[];
  caseStudy?: any;
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

// Dot colours for the main technology, as GitHub shows beside a repository
const techColors: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  "Next.js": "#3178c6",
  Docker: "#2496ed",
  k3s: "#ffc61c",
  Git: "#f05032",
  Bash: "#89e051",
};

const PINNED = 6;

function ProjectCard({ project }: { project: Project }) {
  const main = project.tags?.[0];
  const rest = project.tags?.slice(1, 4) ?? [];

  return (
    <article className="group relative flex flex-col rounded-2xl border border-black/[0.09] p-4 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/30">
      <div className="flex items-start gap-3.5">
        {/* Small picture */}
        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {project.imageUrl ? (
            <img
              src={getThumbnailUrl(project.imageUrl)}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (() => {
            const gradient = categoryGradients[project.category || ""] || "from-neutral-600 to-neutral-400";
            const FallbackIcon = categoryIcons[project.category || ""] || Terminal;
            return (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                <FallbackIcon className="size-6 text-white/85" strokeWidth={1.5} />
              </div>
            );
          })()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[#0066cc] dark:text-[#2997ff]">
            {/* The link stretches over the whole card */}
            <Link href={`/project/${project.id}`} className="after:absolute after:inset-0 after:rounded-2xl group-hover:underline">
              {project.title}
            </Link>
          </h3>
          {project.category && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">{project.category}</p>
          )}
        </div>
      </div>

      {project.description && (
        <p className="mt-3 flex-1 text-[13px] leading-relaxed text-neutral-600 line-clamp-3 dark:text-neutral-400">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
        {main && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: techColors[main] || "#8b8b8b" }} />
            {main}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{rest.join(" · ")}</span>
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} source code on GitHub`}
            className="relative z-10 shrink-0 hover:text-neutral-900 transition-colors dark:hover:text-neutral-100"
          >
            <Github className="size-4" />
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} live site`}
            className="relative z-10 shrink-0 hover:text-neutral-900 transition-colors dark:hover:text-neutral-100"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export default function ProjectsSection({ projects, intro }: ProjectsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const extra = projects.length - PINNED;
  const visible = showAll ? projects : projects.slice(0, PINNED);

  return (
    <section
      className="relative mt-16 sm:mt-24"
      data-testid="section-projects"
      data-section="projects"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          Projects
        </h2>

        {intro && (
          <p className="-mt-4 mb-7 text-[15px] text-gray-500 dark:text-neutral-400">
            {intro}
          </p>
        )}

        <GithubActivity />

        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {extra > 0 && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
            >
              {showAll ? "Show less" : `Show ${extra} more`}
              <ChevronDown className={`size-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
