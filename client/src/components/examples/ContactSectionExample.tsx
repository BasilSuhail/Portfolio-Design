import ContactSection from "../ContactSection";

export default function ContactSectionExample() {
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

  return (
    <ContactSection
      socialLinks={mockSocialLinks}
      onSubmit={(data) => console.log("Form submitted:", data)}
    />
  );
}
