import TechStackSection from "../TechStackSection";

export default function TechStackSectionExample() {
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

  return <TechStackSection technologies={mockTechnologies} />;
}
