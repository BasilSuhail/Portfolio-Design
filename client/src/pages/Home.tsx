import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import JourneySection from "@/components/JourneySection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import { ContactSection } from "@/components/ContactSection";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollIndicator } from "@/components/ScrollIndicator";
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
  const sectionOrder = [
    "projects",
    "journey",
    "techStack",
    "testimonials",
    "writing",
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
    journey: <JourneySection />,
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
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Scroll Indicator - fixed on left side */}
      <ScrollIndicator />

      {/* Navigation */}
      <Navigation name={content.profile.name} />

      <main id="main-content">
        {/* Hero Section */}
        <div data-section="hero">
          <HeroSection
            name={content.profile.name}
            title={content.profile.title}
            titles={content.profile.titles}
            bio={content.profile.bio}
            email={content.profile.email}
            avatarUrl={content.profile.avatarUrl}
            avatarFallback={content.profile.avatarFallback}
            socialLinks={socialLinks}
          />
        </div>

        {/* Dynamic Sections */}
        {sectionOrder.map((sectionKey: string) => {
          const section = sections[sectionKey];
          return section ? (
            <div key={sectionKey} data-section={sectionKey}>
              {section}
            </div>
          ) : null;
        })}

        {/* Contact Section */}
        <ContactSection
          email={content.profile.email}
          calendarLinks={content.contactSettings?.calendarLinks}
        />
      </main>

      {/* Footer */}
      <Footer
        name={content.profile.name}
        socialLinks={socialLinks}
      />
    </div>
  );
}
