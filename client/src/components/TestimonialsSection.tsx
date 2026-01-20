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
    <section className="mt-10 sm:mt-14" data-testid="section-testimonials" data-section="testimonials">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 font-medium text-gray-800 dark:text-neutral-200">
          Testimonials
        </h2>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Grid - Preline Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 border-y border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:border-neutral-700 dark:divide-neutral-700">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`${index === 0 ? "sm:-ms-4" : ""} py-6 sm:px-4`}
              data-testid={`testimonial-${testimonial.id}`}
            >
              {/* Review */}
              <blockquote>
                <span className="text-sm text-gray-800 dark:text-neutral-200">
                  {testimonial.quote}
                </span>

                <footer className="mt-3">
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
