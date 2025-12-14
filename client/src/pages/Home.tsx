import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import ContactSection from "@/components/ContactSection";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <main id="main-content">
        <HeroSection
          name={content.profile.name}
          title={content.profile.title}
          bio={content.profile.bio}
          email={content.profile.email}
          avatarUrl={content.profile.avatarUrl}
          avatarFallback={content.profile.avatarFallback}
        />

        {visibility.projects && content.projects.length > 0 && (
          <ProjectsSection
            projects={content.projects}
            intro={content.sectionIntros?.projects}
          />
        )}

        {visibility.experience && content.experiences.length > 0 && (
          <ExperienceSection
            experiences={content.experiences}
            intro={content.sectionIntros?.experience}
          />
        )}

        {visibility.education && content.education && content.education.length > 0 && (
          <EducationSection
            education={content.education}
            intro={content.sectionIntros?.education}
            achievementsLabel={content.educationLabels?.achievementsLabel}
            certificationsLabel={content.educationLabels?.certificationsLabel}
          />
        )}

        {visibility.techStack && content.technologies.length > 0 && (
          <TechStackSection
            technologies={content.technologies as any}
            intro={content.sectionIntros?.techStack}
          />
        )}

        {visibility.testimonials && content.testimonials.length > 0 && (
          <TestimonialsSection
            testimonials={content.testimonials}
            intro={content.sectionIntros?.testimonials}
          />
        )}

        {visibility.writing && content.posts.length > 0 && (
          <WritingSection
            posts={content.posts}
            intro={content.sectionIntros?.writing}
          />
        )}

        {visibility.contact && (
          <ContactSection
            socialLinks={content.socialLinks as any}
            onSubmit={(data) => console.log("Form submitted:", data)}
            showForm={content.contactSettings?.showForm ?? true}
            calendarLinks={content.contactSettings?.calendarLinks}
          />
        )}
      </main>
    </div>
  );
}
