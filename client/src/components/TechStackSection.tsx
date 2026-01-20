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
  SiSpotify,
  SiPython,
  SiGooglegemini,
  SiPerplexity,
  SiWolframmathematica,
  SiAnthropic,
  SiJavascript,
  SiGit,
  SiNumpy,
  SiPandas,
  SiMysql,
  SiCanva,
} from "react-icons/si";
import { VscCode } from "react-icons/vsc";
import { Users, Lightbulb, MessageSquare } from "lucide-react";

export interface TechItem {
  id: string;
  name: string;
  icon: "figma" | "framer" | "react" | "typescript" | "tailwind" | "openai" | "github" | "stripe" | "vercel" | "spotify" | "claude" | "vscode" | "gemini" | "perplexity" | "wolfram" | "python" | "javascript" | "git" | "numpy" | "pandas" | "sql" | "matplotlib" | string;
  color?: string;
  category?: string;
}

interface TechStackSectionProps {
  technologies: TechItem[];
  intro?: string;
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
  claude: SiAnthropic,
  vscode: VscCode,
  gemini: SiGooglegemini,
  perplexity: SiPerplexity,
  wolfram: SiWolframmathematica,
  python: SiPython,
  javascript: SiJavascript,
  git: SiGit,
  numpy: SiNumpy,
  pandas: SiPandas,
  sql: SiMysql,
  canva: SiCanva,
  teamwork: Users,
  problemsolving: Lightbulb,
  communication: MessageSquare,
};

const colorMap: Record<string, string> = {
  figma: "#F24E1E",
  framer: "#0055FF",
  react: "#61DAFB",
  typescript: "#3178C6",
  tailwind: "#06B6D4",
  openai: "#ffffff",
  github: "#000000",
  stripe: "#635BFF",
  vercel: "#ffffff",
  spotify: "#1DB954",
  claude: "#CC785C",
  vscode: "#007ACC",
  gemini: "#4285F4",
  perplexity: "#20808D",
  wolfram: "#DD1100",
  python: "#3776AB",
  javascript: "#F7DF1E",
  git: "#F05032",
  numpy: "#013243",
  pandas: "#150458",
  sql: "#4479A1",
  canva: "#00C4CC",
  teamwork: "#4F46E5",
  problemsolving: "#F59E0B",
  communication: "#10B981",
};

export default function TechStackSection({ technologies, intro }: TechStackSectionProps) {
  // Group technologies by category if categories exist
  const categorizedTech = technologies.reduce((acc, tech) => {
    const category = tech.category || 'Tools';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tech);
    return acc;
  }, {} as Record<string, TechItem[]>);

  const hasCategories = Object.keys(categorizedTech).length > 1 ||
    (Object.keys(categorizedTech).length === 1 && Object.keys(categorizedTech)[0] !== 'Tools');

  return (
    <section className="mt-10 sm:mt-14" data-testid="section-stack" data-section="techStack">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 font-medium text-gray-800 dark:text-neutral-200">
          Skills
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Skills List - Preline Style */}
        <div className="space-y-3">
          {hasCategories ? (
            // Categorized display
            Object.entries(categorizedTech).map(([category, techs]) => (
              <dl key={category} className="flex flex-col sm:flex-row gap-1">
                <dt className="min-w-40">
                  <span className="block text-sm text-gray-500 dark:text-neutral-500">
                    {category}:
                  </span>
                </dt>
                <dd>
                  <ul className="flex flex-wrap">
                    {techs.map((tech, index) => {
                      const isImageUrl = tech.icon.startsWith('/') || tech.icon.startsWith('http');
                      const Icon = isImageUrl ? null : iconMap[tech.icon as keyof typeof iconMap];
                      const color = tech.color || colorMap[tech.icon] || "#6b7280";
                      const needsInversion = ['github', 'claude', 'numpy', 'pandas'].includes(tech.icon);
                      const isLast = index === techs.length - 1;

                      return (
                        <li
                          key={tech.id}
                          className={`me-1 ${!isLast ? "after:content-[',']" : ""} inline-flex items-center text-sm text-gray-800 dark:text-neutral-200`}
                          data-testid={`icon-tech-${tech.id}`}
                        >
                          {isImageUrl ? (
                            <img
                              src={tech.icon}
                              alt={tech.name}
                              className="shrink-0 size-4 me-1 object-contain"
                            />
                          ) : Icon ? (
                            <Icon
                              className={`shrink-0 size-4 me-1 ${needsInversion ? 'dark:invert' : ''}`}
                              style={{ color }}
                            />
                          ) : null}
                          {tech.name}
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </dl>
            ))
          ) : (
            // Simple display (all tools in one row)
            <dl className="flex flex-col sm:flex-row gap-1">
              <dt className="min-w-40">
                <span className="block text-sm text-gray-500 dark:text-neutral-500">
                  Tools:
                </span>
              </dt>
              <dd>
                <ul className="flex flex-wrap">
                  {technologies.map((tech, index) => {
                    const isImageUrl = tech.icon.startsWith('/') || tech.icon.startsWith('http');
                    const Icon = isImageUrl ? null : iconMap[tech.icon as keyof typeof iconMap];
                    const color = tech.color || colorMap[tech.icon] || "#6b7280";
                    const needsInversion = ['github', 'claude', 'numpy', 'pandas'].includes(tech.icon);
                    const isLast = index === technologies.length - 1;

                    return (
                      <li
                        key={tech.id}
                        className={`me-1 ${!isLast ? "after:content-[',']" : ""} inline-flex items-center text-sm text-gray-800 dark:text-neutral-200`}
                        data-testid={`icon-tech-${tech.id}`}
                      >
                        {isImageUrl ? (
                          <img
                            src={tech.icon}
                            alt={tech.name}
                            className="shrink-0 size-4 me-1 object-contain"
                          />
                        ) : Icon ? (
                          <Icon
                            className={`shrink-0 size-4 me-1 ${needsInversion ? 'dark:invert' : ''}`}
                            style={{ color }}
                          />
                        ) : null}
                        {tech.name}
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
