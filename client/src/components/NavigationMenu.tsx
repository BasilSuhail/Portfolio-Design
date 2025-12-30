import { Link, useLocation } from "wouter";

interface NavigationMenuProps {
  sections: Array<{
    id: string;
    label: string;
    subsections?: string[];
    href?: string;
  }>;
}

export function NavigationMenu({ sections }: NavigationMenuProps) {
  const [location] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed top-6 left-6 z-50 flex gap-2 items-center">
      {sections.map((section) => (
        section.href ? (
          <Link key={section.id} href={section.href}>
            <a className="text-sm font-medium text-foreground hover:text-primary transition-colors px-4 py-2 rounded-full bg-background border border-border shadow-sm hover:shadow-md">
              {section.label}
            </a>
          </Link>
        ) : (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors px-4 py-2 rounded-full bg-background border border-border shadow-sm hover:shadow-md"
          >
            {section.label}
          </button>
        )
      ))}
    </div>
  );
}
