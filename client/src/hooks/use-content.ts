import { useQuery } from "@tanstack/react-query";

export interface PortfolioContent {
  sectionVisibility: {
    projects: boolean;
    experience: boolean;
    techStack: boolean;
    testimonials: boolean;
    writing: boolean;
    contact: boolean;
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
