import { useEffect, useState, lazy, Suspense } from "react";
import { useRoute, Link } from "wouter";
import { useContent } from "@/hooks/use-content";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

const MermaidDiagram = lazy(() => import("@/components/MermaidDiagram"));

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const { data: content, isLoading } = useContent() as { data: any; isLoading: boolean };
  const [project, setProject] = useState<any>(null);

  const socialLinks = {
    github: content?.socialLinks?.find((l: any) => l.platform === 'github')?.url,
    linkedin: content?.socialLinks?.find((l: any) => l.platform === 'linkedin')?.url,
    twitter: content?.socialLinks?.find((l: any) => l.platform === 'twitter')?.url,
  };

  useEffect(() => {
    if (content && params?.id) {
      const foundProject = content.projects.find((p: any) => p.id === params.id);
      setProject(foundProject);
    }
  }, [content, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navigation name={content?.profile?.name || "Portfolio"} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-gray-400 rounded-full dark:text-neutral-500" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
        <Footer name={content?.profile?.name} socialLinks={socialLinks} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navigation name={content?.profile?.name || "Portfolio"} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">Project not found</p>
            <Link href="/">
              <LiquidGlassButton>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </LiquidGlassButton>
            </Link>
          </div>
        </div>
        <Footer name={content?.profile?.name} socialLinks={socialLinks} />
      </div>
    );
  }

  const cs = project.caseStudy;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Helmet>
        <title>{project.title} | {content?.profile?.name || "Basil Suhail"}</title>
        <meta name="description" content={project.description || project.title} />
        <link rel="icon" type="image/png" href="/uploads/optimized/favicon.webp" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${project.title} | ${content?.profile?.name || "Basil Suhail"}`} />
        <meta property="og:description" content={project.description || project.title} />
        {project.imageUrl && <meta property="og:image" content={`https://basilsuhail.com${project.imageUrl}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={project.title} />
        <meta name="twitter:description" content={project.description || project.title} />
        <link rel="canonical" href={`https://basilsuhail.com/project/${project.id}`} />
      </Helmet>

      <Navigation name={content?.profile?.name || "Portfolio"} />

      <main className="pt-10 pb-16">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link href="/">
            <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer mb-4">
              <ArrowLeft className="size-3" />
              Back to Home
            </span>
          </Link>

          {/* Hero image */}
          {project.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 mb-8">
              <img
                src={getOptimizedImageUrl(project.imageUrl)}
                alt={`${project.title} screenshot`}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Title + meta */}
          <div className="mb-6">
            {project.category && (
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {project.category}
              </p>
            )}
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100 mb-3">
              {project.title}
            </h1>
            {cs?.subtitle ? (
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                {cs.subtitle}
              </p>
            ) : project.description ? (
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                {project.description}
              </p>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-8">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <LiquidGlassButton>
                  <ExternalLink className="size-4" />
                  View Live
                </LiquidGlassButton>
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <LiquidGlassButton variant="outline">
                  <Github className="size-4" />
                  View Code
                </LiquidGlassButton>
              </a>
            )}
          </div>

          {/* Case study stats */}
          {cs?.stats && cs.stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {cs.stats.map((stat: any, i: number) => (
                <div
                  key={i}
                  className="text-center py-4 px-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900"
                >
                  <div className="text-xl font-bold font-mono text-gray-900 dark:text-neutral-100">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-neutral-500 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tech stack pills */}
          {cs?.techStack && cs.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-10">
              {cs.techStack.map((tech: string) => (
                <Badge key={tech} variant="secondary" className="px-2.5 py-1 text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}

          {/* Architecture diagram */}
          {cs?.diagram && (
            <div className="mb-10">
              <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-4">
                Architecture
              </h2>
              <div className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-4 overflow-x-auto">
                <Suspense fallback={<div className="text-xs text-gray-400 py-4 text-center">Loading diagram...</div>}>
                  <MermaidDiagram chart={cs.diagram} />
                </Suspense>
              </div>
            </div>
          )}

          {/* Case study sections */}
          {cs?.sections && cs.sections.length > 0 && (
            <div className="space-y-8">
              {cs.sections.map((section: any, i: number) => (
                <div key={i}>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-3">
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: longDescription for projects without case study */}
          {!cs?.sections && project.longDescription && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-3">
                About This Project
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-400 whitespace-pre-line">
                {project.longDescription}
              </p>
            </div>
          )}

          {/* Gallery */}
          {(project.imageUrl || (project.additionalImages && project.additionalImages.length > 0)) && (
            <div className="mt-12">
              <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-4">
                Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.additionalImages && project.additionalImages.map((imageUrl: string, index: number) => (
                  <Card key={index} className="overflow-hidden border border-gray-200 dark:border-neutral-700">
                    <img
                      src={getOptimizedImageUrl(imageUrl)}
                      alt={`${project.title} — image ${index + 1}`}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && !cs?.techStack && (
            <div className="flex flex-wrap gap-1.5 mt-8">
              {project.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer name={content?.profile?.name} socialLinks={socialLinks} />
    </div>
  );
}
