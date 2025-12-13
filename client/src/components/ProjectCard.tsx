import { Link } from "wouter";

interface ProjectCardProps {
  id: string;
  title: string;
  imageUrl: string;
  rotation?: number;
  className?: string;
}

export default function ProjectCard({
  id,
  title,
  imageUrl,
  rotation = 0,
  className = "",
}: ProjectCardProps) {
  const rotationClass = rotation > 0 ? "rotate-2" : rotation < 0 ? "-rotate-2" : "";

  return (
    <Link href={`/project/${id}`}>
      <div
        className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:z-10 ${rotationClass} ${className}`}
        data-testid={`card-project-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="bg-card rounded-xl overflow-hidden border border-card-border shadow-lg">
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-xl ring-2 ring-white/10 pointer-events-none" />
      </div>
    </Link>
  );
}
