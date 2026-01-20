import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import GameSection from "@/components/GameSection";
import { ContactSection } from "@/components/ContactSection";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useContent } from "@/hooks/use-content";

export default function Home() {
  const { data: content, isLoading, error } = useContent();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-gray-400 rounded-full dark:text-neutral-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-red-500 dark:text-red-400">Failed to load content. Please try again.</p>
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

  // Extract social links from content
  const socialLinks = {
    github: content.socialLinks?.find((l: any) => l.platform === 'github')?.url,
    linkedin: content.socialLinks?.find((l: any) => l.platform === 'linkedin')?.url,
    twitter: content.socialLinks?.find((l: any) => l.platform === 'twitter')?.url,
  };

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
    news: null, // News is now a separate page accessible via nav
    game: (visibility as any).game ? <GameSection /> : null,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <Navigation name={content.profile.name} />

      <main id="main-content">
        {/* Hero Section */}
        <HeroSection
          name={content.profile.name}
          title={content.profile.title}
          bio={content.profile.bio}
          email={content.profile.email}
          avatarUrl={content.profile.avatarUrl}
          avatarFallback={content.profile.avatarFallback}
          socialLinks={socialLinks}
        />

        {/* Dynamic Sections */}
        {sectionOrder.map((sectionKey: string) => {
          const section = sections[sectionKey];
          return section ? (
            <div key={sectionKey}>
              {section}
            </div>
          ) : null;
        })}

        {/* Contact Section */}
        <ContactSection email={content.profile.email} />
      </main>

      {/* Footer */}
      <Footer
        name={content.profile.name}
        socialLinks={socialLinks}
      />
    </div>
  );
}
