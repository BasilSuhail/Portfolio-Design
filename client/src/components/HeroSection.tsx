import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Check } from "lucide-react";

interface HeroSectionProps {
  name: string;
  title: string;
  bio: string;
  email: string;
  avatarUrl: string;
  avatarFallback: string;
  isVerified?: boolean;
}

export default function HeroSection({
  name,
  title,
  bio,
  email,
  avatarUrl,
  avatarFallback,
  isVerified = true,
}: HeroSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && !window.getSelection()?.toString()) {
        copyEmail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [email]);

  return (
    <section className="py-16 md:py-24" data-testid="section-hero">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 ring-2 ring-border" data-testid="img-avatar">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-name">
            {name}
            {isVerified && (
              <CheckCircle className="w-5 h-5 text-primary fill-primary" />
            )}
          </h1>
          <p className="text-muted-foreground" data-testid="text-title">{title}</p>
        </div>

        <p className="text-foreground/90 leading-relaxed mb-8" data-testid="text-bio">
          {bio}
        </p>

        <button
          onClick={copyEmail}
          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate active-elevate-2 px-3 py-2 -mx-3 rounded-lg transition-colors"
          data-testid="button-copy-email"
        >
          Press{" "}
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {copied ? <Check className="w-3 h-3" /> : "C"}
          </Badge>{" "}
          to copy my email
          {copied && <span className="text-primary ml-2">Copied!</span>}
        </button>
      </div>
    </section>
  );
}
