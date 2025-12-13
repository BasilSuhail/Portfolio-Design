import TestimonialCard from "./TestimonialCard";

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  authorFallback: string;
  companyLogoUrl?: string;
  companyColor?: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  intro?: string;
}

export default function TestimonialsSection({
  testimonials,
  intro,
}: TestimonialsSectionProps) {
  return (
    <section className="py-16" data-testid="section-testimonials">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            TESTIMONIALS
          </span>
          {intro && (
            <p className="text-foreground/80">
              {intro}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              quote={testimonial.quote}
              authorName={testimonial.authorName}
              authorRole={testimonial.authorRole}
              authorAvatar={testimonial.authorAvatar}
              authorFallback={testimonial.authorFallback}
              companyLogoUrl={testimonial.companyLogoUrl}
              companyColor={testimonial.companyColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
