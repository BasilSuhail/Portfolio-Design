import { 
  SiFigma, 
  SiFramer, 
  SiReact, 
  SiTypescript, 
  SiTailwindcss, 
  SiOpenai, 
  SiGithub, 
  SiStripe, 
  SiVercel,
  SiSpotify 
} from "react-icons/si";

export interface TechItem {
  id: string;
  name: string;
  icon: "figma" | "framer" | "react" | "typescript" | "tailwind" | "openai" | "github" | "stripe" | "vercel" | "spotify";
  color?: string;
}

interface TechStackSectionProps {
  technologies: TechItem[];
}

const iconMap = {
  figma: SiFigma,
  framer: SiFramer,
  react: SiReact,
  typescript: SiTypescript,
  tailwind: SiTailwindcss,
  openai: SiOpenai,
  github: SiGithub,
  stripe: SiStripe,
  vercel: SiVercel,
  spotify: SiSpotify,
};

const colorMap: Record<string, string> = {
  figma: "#F24E1E",
  framer: "#0055FF",
  react: "#61DAFB",
  typescript: "#3178C6",
  tailwind: "#06B6D4",
  openai: "#ffffff",
  github: "#ffffff",
  stripe: "#635BFF",
  vercel: "#ffffff",
  spotify: "#1DB954",
};

export default function TechStackSection({ technologies }: TechStackSectionProps) {
  return (
    <section className="py-16" data-testid="section-stack">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            STACK
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {technologies.map((tech) => {
            const Icon = iconMap[tech.icon];
            const color = tech.color || colorMap[tech.icon] || "#ffffff";
            
            return (
              <div
                key={tech.id}
                className="group relative"
                data-testid={`icon-tech-${tech.id}`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-card-border hover-elevate transition-all duration-200 cursor-pointer">
                  <Icon 
                    className="w-6 h-6 transition-transform group-hover:scale-110" 
                    style={{ color }} 
                  />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs text-muted-foreground bg-popover px-2 py-1 rounded whitespace-nowrap">
                    {tech.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
