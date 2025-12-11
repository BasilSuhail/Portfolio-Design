import ExperienceSection from "../ExperienceSection";

export default function ExperienceSectionExample() {
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

  return <ExperienceSection experiences={mockExperiences} />;
}
