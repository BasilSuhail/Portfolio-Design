import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useContent } from "@/hooks/use-content";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const { data: content, isLoading } = useContent();
  const [project, setProject] = useState<any>(null);

  // Extract social links from content
  const socialLinks = {
    github: content?.socialLinks?.find((l: any) => l.platform === 'github')?.url,
    linkedin: content?.socialLinks?.find((l: any) => l.platform === 'linkedin')?.url,
    twitter: content?.socialLinks?.find((l: any) => l.platform === 'twitter')?.url,
  };

  useEffect(() => {
    if (content && params?.id) {
      const foundProject = content.projects.find((p) => p.id === params.id);
      setProject(foundProject);
    }
  }, [content, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900">
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
      <div className="min-h-screen bg-white dark:bg-neutral-900">
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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Helmet>
        <title>{project.title} | {content?.profile?.name || "Portfolio"}</title>
        <meta name="description" content={project.description || project.title} />
        <link rel="icon" type="image/jpeg" href="/uploads/favicon.jpg" />
      </Helmet>

      <Navigation name={content?.profile?.name || "Portfolio"} />

      <main className="pt-10 pb-8">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer mb-2">
                <ArrowLeft className="size-3" />
                Back to Home
              </span>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-neutral-200 mb-2">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                {project.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
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

          {/* Long Description */}
          {project.longDescription && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-3">
                About This Project
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-400 whitespace-pre-line">
                {project.longDescription}
              </p>
            </div>
          )}

          {/* Gallery - includes main image and additional images */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-4">
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Project Image as first item in gallery */}
              <Card className="overflow-hidden border border-gray-200 dark:border-neutral-700">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-auto object-cover"
                />
              </Card>

              {/* Additional Images */}
              {project.additionalImages && project.additionalImages.map((imageUrl: string, index: number) => (
                <Card key={index} className="overflow-hidden border border-gray-200 dark:border-neutral-700">
                  <img
                    src={imageUrl}
                    alt={`${project.title} screenshot ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer name={content?.profile?.name} socialLinks={socialLinks} />
    </div>
  );
}
