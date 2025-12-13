import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useContent } from "@/hooks/use-content";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const { data: content, isLoading } = useContent();
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (content && params?.id) {
      const foundProject = content.projects.find((p) => p.id === params.id);
      setProject(foundProject);
    }
  }, [content, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Project not found</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Project Header */}
          <div>
            <h1 className="text-5xl font-bold mb-4">{project.title}</h1>
            {project.description && (
              <p className="text-xl text-muted-foreground">{project.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  View Live
                </Button>
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  <Github className="mr-2 h-5 w-5" />
                  View Code
                </Button>
              </a>
            )}
          </div>

          {/* Long Description */}
          {project.longDescription && (
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold mb-4">About This Project</h2>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                {project.longDescription}
              </p>
            </div>
          )}

          {/* Gallery - includes main image and additional images */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Project Image as first item in gallery */}
              <Card className="overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-auto object-cover"
                />
              </Card>

              {/* Additional Images */}
              {project.additionalImages && project.additionalImages.map((imageUrl: string, index: number) => (
                <Card key={index} className="overflow-hidden">
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
      </div>
    </div>
  );
}
