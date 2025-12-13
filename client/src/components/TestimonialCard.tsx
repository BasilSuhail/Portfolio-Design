import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Circle } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  authorFallback: string;
  companyLogoUrl?: string;
  companyColor?: string;
}

export default function TestimonialCard({
  quote,
  authorName,
  authorRole,
  authorAvatar,
  authorFallback,
  companyLogoUrl,
  companyColor = "#FFB800",
}: TestimonialCardProps) {
  return (
    <div
      className="bg-card border border-card-border rounded-xl p-6 hover-elevate transition-all duration-300"
      data-testid={`card-testimonial-${authorName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <blockquote className="mb-6">
        <span className="text-4xl text-muted-foreground leading-none">"</span>
        <p className="text-foreground/90 leading-relaxed -mt-4 ml-4">{quote}</p>
      </blockquote>

      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
          <AvatarFallback className="text-sm">{authorFallback}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{authorName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt="Company logo"
                className="w-4 h-4 object-contain rounded"
              />
            ) : (
              <Circle
                className="w-3 h-3"
                style={{ fill: companyColor, color: companyColor }}
              />
            )}
            <span>{authorRole}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
