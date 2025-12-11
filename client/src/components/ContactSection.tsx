import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, ExternalLink } from "lucide-react";
import { SiX, SiGithub, SiLinkedin } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export interface SocialLink {
  platform: "email" | "x" | "github" | "linkedin";
  label: string;
  value: string;
  url: string;
}

interface ContactSectionProps {
  socialLinks: SocialLink[];
  onSubmit?: (data: { name: string; email: string; message: string }) => void;
}

const platformIcons = {
  email: Mail,
  x: SiX,
  github: SiGithub,
  linkedin: SiLinkedin,
};

export default function ContactSection({
  socialLinks,
  onSubmit,
}: ContactSectionProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (onSubmit) {
      onSubmit(formData);
    }

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. I'll get back to you soon.",
    });

    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <section className="py-16" data-testid="section-contact">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            CONTACT
          </span>
          <p className="text-foreground/80">
            You can contact me using the form or via the links below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              data-testid="input-name"
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              data-testid="input-email"
            />
          </div>
          <Textarea
            placeholder="Message"
            className="min-h-[120px] resize-none"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            onKeyDown={handleKeyDown}
            required
            data-testid="input-message"
          />
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting} data-testid="button-send">
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
            <span className="text-sm text-muted-foreground">
              or{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>{" "}
              to send
            </span>
          </div>
        </form>

        <div className="space-y-3">
          {socialLinks.map((link) => {
            const Icon = platformIcons[link.platform];
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 group hover-elevate rounded-lg px-3 -mx-3"
                data-testid={`link-${link.platform}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span>{link.label}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{link.value}</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>Portfolio</p>
        </div>
      </div>
    </section>
  );
}
