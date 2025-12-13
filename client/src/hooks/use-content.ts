import { useQuery } from "@tanstack/react-query";

export interface PortfolioContent {
  sectionVisibility: {
    projects: boolean;
    experience: boolean;
    education: boolean;
    techStack: boolean;
    testimonials: boolean;
    writing: boolean;
    contact: boolean;
  };
  sectionIntros: {
    projects?: string;
    experience?: string;
    education?: string;
    techStack?: string;
    testimonials?: string;
    writing?: string;
  };
  educationLabels?: {
    achievementsLabel?: string;
    certificationsLabel?: string;
  };
  profile: {
    name: string;
    title: string;
    bio: string;
    email: string;
    avatarUrl: string;
    avatarFallback: string;
  };
  projects: Array<{
    id: string;
    title: string;
    imageUrl: string;
    description?: string;
    longDescription?: string;
    liveUrl?: string;
    githubUrl?: string;
    additionalImages?: string[];
  }>;
  experiences: Array<{
    id: string;
    dateRange: string;
    role: string;
    company: string;
    companyLogoUrl?: string;
    companyColor?: string;
    description: string;
    customSections?: Array<{
      label: string;
      items: Array<{
        name: string;
        url?: string;
      }>;
    }>;
  }>;
  education: Array<{
    id: string;
    dateRange: string;
    degree: string;
    institution: string;
    institutionLogoUrl?: string;
    institutionColor?: string;
    coursework?: string;
    customSections?: Array<{
      label: string;
      items: Array<{
        name: string;
        url?: string;
      }>;
    }>;
    certifications?: Array<{
      name: string;
      url?: string;
    }>;
    achievements?: string[];
  }>;
  testimonials: Array<{
    id: string;
    quote: string;
    authorName: string;
    authorRole: string;
    authorFallback: string;
    companyLogoUrl?: string;
    companyColor?: string;
  }>;
  technologies: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  posts: Array<{
    id: string;
    date: string;
    title: string;
    readTime: number;
  }>;
  socialLinks: Array<{
    platform: string;
    label: string;
    value: string;
    url: string;
  }>;
  contactSettings?: {
    showForm?: boolean;
    calendarLinks?: {
      link15min?: string;
      link30min?: string;
    };
  };
}

async function fetchContent(): Promise<PortfolioContent> {
  const response = await fetch("/api/content");
  if (!response.ok) {
    throw new Error("Failed to fetch content");
  }
  return response.json();
}

export function useContent() {
  return useQuery({
    queryKey: ["content"],
    queryFn: fetchContent,
  });
}
