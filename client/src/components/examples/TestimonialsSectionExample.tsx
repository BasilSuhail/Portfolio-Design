import TestimonialsSection from "../TestimonialsSection";

export default function TestimonialsSectionExample() {
  // todo: remove mock functionality
  const mockTestimonials = [
    {
      id: "1",
      quote:
        "Collaborating with Jacob on the React-based design system was a game-changer for our team. His attention to detail ensured a smooth rollout that saved us countless hours.",
      authorName: "Evelyn Brooks",
      authorRole: "Lead Engineer at Wait",
      authorFallback: "EB",
      companyColor: "#FFB800",
    },
    {
      id: "2",
      quote:
        "Jacob does exceptional work building experiences across the gateway. His work always maintains a new standard of delivering quality.",
      authorName: "David Chen",
      authorRole: "UX Director",
      authorFallback: "DC",
      companyColor: "#00D4AA",
    },
    {
      id: "3",
      quote:
        "Working with this engineer was transformative. The attention to accessibility and performance made our product stand out in the market.",
      authorName: "Sarah Miller",
      authorRole: "Product Manager",
      authorFallback: "SM",
      companyColor: "#6366F1",
    },
  ];

  return <TestimonialsSection testimonials={mockTestimonials} />;
}
