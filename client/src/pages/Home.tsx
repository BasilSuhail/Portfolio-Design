import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import GameSection from "@/components/GameSection";
import { NewsSection } from "@/components/NewsSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useContent } from "@/hooks/use-content";

export default function Home() {
  const { data: content, isLoading, error } = useContent();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Failed to load content. Please try again.</p>
      </div>
    );
  }

  const visibility = content.sectionVisibility;
  const sectionOrder = content.sectionOrder || [
    "projects",
    "experience",
    "education",
    "techStack",
    "testimonials",
    "writing",
    "news",
    "game",
  ];

  const sections: Record<string, JSX.Element | null> = {
    projects:
      visibility.projects && content.projects.length > 0 ? (
        <ProjectsSection
          projects={content.projects}
          intro={content.sectionIntros?.projects}
        />
      ) : null,
    experience:
      visibility.experience && content.experiences.length > 0 ? (
        <ExperienceSection
          experiences={content.experiences}
          intro={content.sectionIntros?.experience}
        />
      ) : null,
    education:
      visibility.education &&
      content.education &&
      content.education.length > 0 ? (
        <EducationSection
          education={content.education}
          intro={content.sectionIntros?.education}
          achievementsLabel={content.educationLabels?.achievementsLabel}
          certificationsLabel={content.educationLabels?.certificationsLabel}
        />
      ) : null,
    techStack:
      visibility.techStack && content.technologies.length > 0 ? (
        <TechStackSection
          technologies={content.technologies as any}
          intro={content.sectionIntros?.techStack}
        />
      ) : null,
    testimonials:
      visibility.testimonials && content.testimonials.length > 0 ? (
        <TestimonialsSection
          testimonials={content.testimonials}
          intro={content.sectionIntros?.testimonials}
        />
      ) : null,
    writing:
      visibility.writing && content.posts.length > 0 ? (
        <WritingSection
          posts={content.posts}
          intro={content.sectionIntros?.writing}
        />
      ) : null,
    news: <NewsSection />,
    game: (visibility as any).game ? <GameSection /> : null,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>
      <main id="main-content">
        <HeroSection
          name={content.profile.name}
          title={content.profile.title}
          bio={content.profile.bio}
          email={content.profile.email}
          avatarUrl={content.profile.avatarUrl}
          avatarFallback={content.profile.avatarFallback}
        />

        {sectionOrder.map((sectionKey: string) => {
          const section = sections[sectionKey];
          return section ? (
            <div key={sectionKey} data-section={sectionKey}>
              {section}
            </div>
          ) : null;
        })}
      </main>
      <Footer />
    </div>
  );
}
