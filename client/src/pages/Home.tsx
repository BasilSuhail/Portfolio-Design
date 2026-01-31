import { useMemo } from "react";
// import { EditorialTimeline, TimelineItem } from "@/components/EditorialTimeline"; // Reverted
import JourneySection from "@/components/JourneySection"; // Restored
import EnhancedJourneySection from "@/components/EnhancedJourneySection";
import { useContent } from "@/hooks/use-content";
import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import { ContactSection } from "@/components/ContactSection";
import { Navigation } from "@/components/Navigation";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { Github, Linkedin, Twitter, Mail, ExternalLink, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";

const sectionOrder = [
  "projects",
  "journey",
  "techStack",
  "testimonials",
  "writing",
  "contact",
];

export default function Home() {
  const { data, isLoading, error } = useContent();
  const content = data as any; // Cast to any to avoid type errors


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Failed to load content. Please try again later.
      </div>
    );
  }

  const visibility = content.sectionVisibility || {};

  const sections: Record<string, JSX.Element | null> = {
    hero: (
      <HeroSection
        name={content.profile?.name || content.hero?.name}
        title={content.profile?.title || content.hero?.title}
        titles={content.profile?.titles || content.hero?.titles}
        bio={content.profile?.bio || content.hero?.bio}
        email={content.profile?.email}
        avatarUrl={content.profile?.avatarUrl || content.hero?.avatarUrl}
        avatarFallback={content.profile?.avatarFallback || content.hero?.avatarFallback}
        socialLinks={content.socialLinks?.reduce((acc: any, link: any) => {
          acc[link.platform] = link.url;
          return acc;
        }, {})}
      />
    ),
    about: null,

    projects:
      visibility.projects && content.projects.length > 0 ? (
        <ProjectsSection
          projects={content.projects}
          intro={content.sectionIntros?.projects}
        />
      ) : null,

    journey: (
      <EnhancedJourneySection />
    ),

    techStack:
      visibility.techStack && content.technologies.length > 0 ? (
        <TechStackSection
          technologies={content.technologies}
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

    contact: (
      <ContactSection
        email={content.profile?.email}
        calendarLinks={content.contactSettings?.calendarLinks}
      />
    ),

    news: null,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Pass name prop to Navigation if available */}
      <Navigation name={content.hero?.name} />
      <ScrollIndicator />

      <main id="main-content">

        <HeroSection
          name={content.profile?.name || content.hero?.name}
          title={content.profile?.title || content.hero?.title}
          titles={content.profile?.titles || content.hero?.titles}
          bio={content.profile?.bio || content.hero?.bio}
          email={content.profile?.email}
          avatarUrl={content.profile?.avatarUrl || content.hero?.avatarUrl}
          avatarFallback={content.profile?.avatarFallback || content.hero?.avatarFallback}
          socialLinks={content.socialLinks?.reduce((acc: any, link: any) => {
            acc[link.platform] = link.url;
            return acc;
          }, {})}
        />

        {sectionOrder.map((sectionKey: string) => {
          if (sectionKey === 'hero') return null; // Skip if in order
          const section = sections[sectionKey];
          return section ? (
            <div key={sectionKey} data-section={sectionKey}>
              {section}
            </div>
          ) : null;
        })}
      </main>

      <Footer
        name={content.hero?.name}
        socialLinks={content.socialLinks?.reduce((acc: any, link: any) => {
          acc[link.platform] = link.url;
          return acc;
        }, {})}
      />
    </div>
  );
}
