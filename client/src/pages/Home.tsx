import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import TechStackSection from "@/components/TechStackSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WritingSection from "@/components/WritingSection";
import ContactSection from "@/components/ContactSection";

import avatarUrl from "@assets/generated_images/professional_portfolio_headshot.png";
import dashboardImg from "@assets/generated_images/dashboard_project_screenshot.png";
import mobileImg from "@assets/generated_images/mobile_app_project_screenshot.png";
import codeImg from "@assets/generated_images/code_editor_project_screenshot.png";
import ecommerceImg from "@assets/generated_images/e-commerce_project_screenshot.png";

// todo: remove mock functionality - replace with real data from backend
const mockProfile = {
  name: "Basil Suhail",
  title: "Design Engineer",
  bio: "Hey, I'm Jacob a design engineer at University of Aberdeen based in Scotland where I specialize in crafting polished web interfaces with a strong focus on accessibility, web animation, and product design.",
  email: "hello@portfolio.com",
  avatarUrl: avatarUrl,
  avatarFallback: "BS",
};

// todo: remove mock functionality
const mockProjects = [
  { id: "1", title: "Dashboard Analytics", imageUrl: dashboardImg },
  { id: "2", title: "Mobile App", imageUrl: mobileImg },
  { id: "3", title: "Code Editor", imageUrl: codeImg },
  { id: "4", title: "E-commerce Platform", imageUrl: ecommerceImg },
];

// todo: remove mock functionality
const mockExperiences = [
  {
    id: "1",
    dateRange: "2024 - NOW",
    role: "Design engineer",
    company: "Wait",
    companyColor: "#FFB800",
    description:
      "Designed a real-time waitlist and dashboard for monitoring sign ups with live updates, reducing latency by 15%",
  },
  {
    id: "2",
    dateRange: "2024 - NOW",
    role: "Design engineer",
    company: "Omega",
    companyColor: "#00D4AA",
    description:
      "Designed and built an admin panel for enterprise clients, scaling to support over 500 active users per instance.",
  },
  {
    id: "3",
    dateRange: "2017 - 2020",
    role: "Software engineer",
    company: "Theta",
    companyColor: "#6366F1",
    description:
      "Developed the user interface for a crypto payment gateway, ensuring compliance with global accessibility standards.",
  },
];

// todo: remove mock functionality
const mockTestimonials = [
  {
    id: "1",
    quote:
      "Collaborating with Jacob on the React-based design system was a game-changer for our team. His attention to detail ensured a smooth rollout that saved us countless hours.",
    authorName: "Evelyn Brooks",
    authorRole: "Lead Engineer at Wait",
    authorFallback: "EB",
    companyColor: "#FFB800",
  },
  {
    id: "2",
    quote:
      "Jacob does exceptional work building experiences across the gateway. His work always maintains a new standard of delivering quality.",
    authorName: "David Chen",
    authorRole: "UX Director",
    authorFallback: "DC",
    companyColor: "#00D4AA",
  },
  {
    id: "3",
    quote:
      "Working with this engineer was transformative. The attention to accessibility and performance made our product stand out in the market.",
    authorName: "Sarah Miller",
    authorRole: "Product Manager",
    authorFallback: "SM",
    companyColor: "#6366F1",
  },
];

// todo: remove mock functionality
const mockTechnologies = [
  { id: "1", name: "Figma", icon: "figma" as const },
  { id: "2", name: "Framer", icon: "framer" as const },
  { id: "3", name: "React", icon: "react" as const },
  { id: "4", name: "TypeScript", icon: "typescript" as const },
  { id: "5", name: "Tailwind CSS", icon: "tailwind" as const },
  { id: "6", name: "OpenAI", icon: "openai" as const },
  { id: "7", name: "GitHub", icon: "github" as const },
  { id: "8", name: "Stripe", icon: "stripe" as const },
  { id: "9", name: "Vercel", icon: "vercel" as const },
  { id: "10", name: "Spotify", icon: "spotify" as const },
];

// todo: remove mock functionality
const mockPosts = [
  { id: "1", date: "21/02/25", title: "How to think like both a designer & engineer", readTime: 2 },
  { id: "2", date: "16/02/25", title: "UI Performance", readTime: 4 },
  { id: "3", date: "12/02/25", title: "How AI is changing my workflow", readTime: 2 },
  { id: "4", date: "11/01/25", title: "Design tokens 101", readTime: 2 },
  { id: "5", date: "01/01/25", title: "Hello world", readTime: 1 },
];

// todo: remove mock functionality
const mockSocialLinks = [
  {
    platform: "email" as const,
    label: "Email",
    value: "hi@portfolio.com",
    url: "mailto:hi@portfolio.com",
  },
  {
    platform: "x" as const,
    label: "X.com",
    value: "@username",
    url: "https://x.com/username",
  },
  {
    platform: "github" as const,
    label: "GitHub",
    value: "@username",
    url: "https://github.com/username",
  },
  {
    platform: "linkedin" as const,
    label: "LinkedIn",
    value: "/in/username",
    url: "https://linkedin.com/in/username",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        name={mockProfile.name}
        title={mockProfile.title}
        bio={mockProfile.bio}
        email={mockProfile.email}
        avatarUrl={mockProfile.avatarUrl}
        avatarFallback={mockProfile.avatarFallback}
      />

      <ProjectsSection projects={mockProjects} />

      <ExperienceSection experiences={mockExperiences} />

      <TechStackSection technologies={mockTechnologies} />

      <TestimonialsSection testimonials={mockTestimonials} />

      <WritingSection posts={mockPosts} />

      <ContactSection
        socialLinks={mockSocialLinks}
        onSubmit={(data) => console.log("Form submitted:", data)}
      />
    </div>
  );
}
