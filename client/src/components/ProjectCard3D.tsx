import { useState, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ExternalLink, Github } from "lucide-react";

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
}

// Rotation intensity
const ROTATION_RANGE = 20;
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;

const ProjectCard3D = ({
  title,
  tags,
  imageUrl,
  liveUrl,
  githubUrl,
  index,
}: ProjectCard3DProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for tilt
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Motion values for magnet/follow effect
  const translateX = useMotionValue(0);
  const translateY = useMotionValue(0);

  // Springs for smooth animation
  const springConfig = { stiffness: 300, damping: 20 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  const translateXSpring = useSpring(translateX, { stiffness: 150, damping: 15 });
  const translateYSpring = useSpring(translateY, { stiffness: 150, damping: 15 });

  // Combined transform template
  const transform = useMotionTemplate`
    perspective(1000px)
    rotateX(${rotateXSpring}deg)
    rotateY(${rotateYSpring}deg)
    translateX(${translateXSpring}px)
    translateY(${translateYSpring}px)
  `;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
    const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

    const rX = (mouseY / height - HALF_ROTATION_RANGE) * -1;
    const rY = mouseX / width - HALF_ROTATION_RANGE;

    rotateX.set(rX);
    rotateY.set(rY);

    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    const magnetStrength = 8;
    translateX.set((e.clientX - centerX) / magnetStrength);
    translateY.set((e.clientY - centerY) / magnetStrength);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    translateX.set(0);
    translateY.set(0);
  };

  return (
    <motion.article
      ref={cardRef}
      className="group relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.23, 1, 0.32, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Tilt + Magnet container */}
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          transform,
        }}
      >
        <div
          className="block overflow-hidden rounded-xl
            bg-white dark:bg-neutral-900
            border-2 border-neutral-200 dark:border-neutral-700
            shadow-[0_4px_20px_rgba(0,0,0,0.08)]
            dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]
            transition-all duration-300
            hover:border-neutral-300 dark:hover:border-neutral-600"
        >
          {/* Smaller Image */}
          <a
            href={liveUrl || githubUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              {imageUrl ? (
                <motion.img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover object-top"
                  animate={{ scale: isHovered ? 1.05 : 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
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

          {/* Content below image */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>

            {/* Tech Stack - spaced out */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium rounded-md
                    bg-neutral-100 dark:bg-neutral-800
                    text-neutral-600 dark:text-neutral-400
                    border border-neutral-200 dark:border-neutral-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quick Links - glass icon layout - always visible */}
            <div className="flex gap-2 pt-2">
              <a
                href={liveUrl || "#"}
                target={liveUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg
                  bg-black/[0.04] border border-black/15 backdrop-blur-sm
                  shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.1)]
                  dark:bg-white/[0.05] dark:border-white/15
                  dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.25)]
                  text-neutral-700 dark:text-neutral-200
                  hover:bg-black/[0.08] dark:hover:bg-white/[0.1]
                  hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200
                  ${!liveUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!liveUrl) e.preventDefault();
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Demo
              </a>
              <a
                href={githubUrl || "#"}
                target={githubUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg
                  bg-black/[0.04] border border-black/15 backdrop-blur-sm
                  shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.1)]
                  dark:bg-white/[0.05] dark:border-white/15
                  dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.25)]
                  text-neutral-700 dark:text-neutral-200
                  hover:bg-black/[0.08] dark:hover:bg-white/[0.1]
                  hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200
                  ${!githubUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!githubUrl) e.preventDefault();
                }}
              >
                <Github className="w-3.5 h-3.5" />
                Source
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Shadow */}
      <div
        className={`absolute inset-2 -z-10 rounded-xl bg-black/10 dark:bg-black/30 blur-xl transition-opacity duration-300 ${
          isHovered ? "opacity-80" : "opacity-0"
        }`}
        style={{ transform: "translateY(10px)" }}
      />
    </motion.article>
  );
};

export default ProjectCard3D;
