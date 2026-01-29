import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProjectCard3D from "./ProjectCard3D";
import FloatingParticles from "./FloatingParticles";
import { LiquidGlassButton } from "./ui/liquid-glass";

export interface Project {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  tags?: string[];
}

interface ProjectsSectionProps {
  projects: Project[];
  intro?: string;
}

// Number of projects to show initially (2 rows of 2)
const INITIAL_DISPLAY_COUNT = 4;

export default function ProjectsSection({ projects, intro }: ProjectsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which projects to display
  const displayedProjects = isExpanded
    ? projects
    : projects.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMoreProjects = projects.length > INITIAL_DISPLAY_COUNT;

  return (
    <section
      className="relative mt-10 sm:mt-14 py-8"
      data-testid="section-projects"
      data-section="projects"
    >
      {/* Floating particles background */}
      <FloatingParticles />

      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_70%_96%)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_hsl(220_30%_15%)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(280_60%_96%)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,_hsl(280_30%_15%)_0%,_transparent_50%)]" />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Standard heading matching other sections */}
        <h2 className="mb-5 font-medium text-gray-800 dark:text-neutral-200">
          Projects
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6">
            {intro}
          </p>
        )}

        {/* 3D Cards Grid - 2 per row for large cards */}
        <div className="relative z-10" style={{ perspective: 2000 }}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {displayedProjects.map((project, index) => (
              <ProjectCard3D
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description || ""}
                imageUrl={project.imageUrl}
                liveUrl={project.liveUrl}
                githubUrl={project.githubUrl}
                tags={project.tags || []}
                index={index}
              />
            ))}
          </motion.div>
        </div>

        {/* Expand/Collapse Button */}
        {hasMoreProjects && (
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LiquidGlassButton
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show More ({projects.length - INITIAL_DISPLAY_COUNT} more)
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </LiquidGlassButton>
          </motion.div>
        )}
      </div>
    </section>
  );
}
