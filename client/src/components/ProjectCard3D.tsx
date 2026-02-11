import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import GlassButton from "./ui/GlassButton";
import { getOptimizedImageUrl, getResponsiveSrcSet } from "@/lib/imageUtils";

export interface ProjectCard3DProps {
  id?: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  category?: string;
  index: number;
  /** Mark as above-the-fold to disable lazy loading and boost fetch priority */
  priority?: boolean;
}

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

const ProjectCard3D = ({
  title,
  tags,
  imageUrl,
  liveUrl,
  githubUrl,
  index,
  priority = false,
}: ProjectCard3DProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  const rotateAmplitude = 15;
  const scaleOnHover = 1.2;

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    setIsHovered(true);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    setIsHovered(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`group relative ${isHovered ? "z-50" : "z-0"}`}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        className="block rounded-xl
          bg-white dark:bg-neutral-900
          border border-neutral-100/50 dark:border-neutral-800/50
          shadow-[0_2px_10px_rgba(0,0,0,0.04)]
          dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)]
          transition-colors duration-300"
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image */}
        <a
          href={liveUrl || githubUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-t-xl"
        >
          <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            {imageUrl ? (
              <img
                src={getOptimizedImageUrl(imageUrl)}
                srcSet={getResponsiveSrcSet(imageUrl)}
                sizes={getResponsiveSrcSet(imageUrl) ? "(max-width: 768px) 100vw, 50vw" : undefined}
                alt={title}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                width={720}
                height={405}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                <span className="text-5xl font-bold text-neutral-300 dark:text-neutral-700">
                  {title.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </a>

        {/* Content */}
        <div className="p-4 space-y-3" style={{ transformStyle: "preserve-3d" }}>
          {/* Title */}
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-md
                  bg-neutral-100 dark:bg-neutral-800
                  text-neutral-600 dark:text-neutral-400
                  border border-neutral-200/50 dark:border-neutral-700/50"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Quick Links - float above the card */}
          <div
            className="flex gap-2 pt-2"
            style={{ transform: "translateZ(20px)" }}
          >
            <GlassButton
              href={liveUrl}
              icon={<ExternalLink />}
              color="blue"
              disabled={!liveUrl}
              onClick={(e) => e.stopPropagation()}
            >
              Live Demo
            </GlassButton>
            <GlassButton
              href={githubUrl}
              icon={<Github />}
              color="neutral"
              disabled={!githubUrl}
              onClick={(e) => e.stopPropagation()}
            >
              Source
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
};

export default ProjectCard3D;
