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
    <div className="flex gap-3 sm:gap-4 items-center flex-wrap">
      {sections.map((section) => (
        section.href ? (
          <Link key={section.id} href={section.href}>
            <a className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
              {section.label}
            </a>
          </Link>
        ) : (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            {section.label}
          </button>
        )
      ))}
    </div>
  );
}
