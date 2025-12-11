import HeroSection from "../HeroSection";
import avatarUrl from "@assets/generated_images/professional_portfolio_headshot.png";

export default function HeroSectionExample() {
  return (
    <HeroSection
      name="Basil Suhail"
      title="Design Engineer"
      bio="Hey, I'm Jacob a design engineer at University of Aberdeen based in Scotland where I specialize in crafting polished web interfaces with a strong focus on accessibility, web animation, and product design."
      email="hello@portfolio.com"
      avatarUrl={avatarUrl}
      avatarFallback="BS"
      isVerified={true}
    />
  );
}
