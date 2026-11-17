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
    <section className="mt-16 sm:mt-24" data-testid="section-testimonials" data-section="testimonials">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          Testimonials
        </h2>

        {intro && (
          <p className="text-[15px] text-gray-500 dark:text-neutral-400 mb-6">
            {intro}
          </p>
        )}

        {/* Grid - Preline Style */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="border-s-2 border-black/10 ps-5 dark:border-white/15"
              data-testid={`testimonial-${testimonial.id}`}
            >
              {/* Review */}
              <blockquote>
                <span className="text-[15px] leading-relaxed text-gray-800 dark:text-neutral-200">
                  {testimonial.quote}
                </span>

                <footer className="mt-4">
                  <div className="flex items-center gap-x-2">
                    {testimonial.authorAvatar ? (
                      <img
                        className="shrink-0 size-5 rounded-full object-cover"
                        src={testimonial.authorAvatar}
                        alt={testimonial.authorName}
                      />
                    ) : (
                      <div
                        className="shrink-0 size-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                        style={{ backgroundColor: testimonial.companyColor || '#6b7280' }}
                      >
                        {testimonial.authorFallback}
                      </div>
                    )}
                    <div className="grow">
                      <div className="text-xs text-gray-500 dark:text-neutral-500">
                        {testimonial.authorName}
                        {testimonial.authorRole && (
                          <span className="text-gray-400 dark:text-neutral-600">
                            {" "}· {testimonial.authorRole}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </footer>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
