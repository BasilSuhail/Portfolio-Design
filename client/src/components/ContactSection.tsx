import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, ExternalLink, Calendar } from "lucide-react";
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
  showForm?: boolean;
  calendarLinks?: {
    link15min?: string;
    link30min?: string;
  };
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
  showForm = false,
  calendarLinks,
}: ContactSectionProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Spam trap
  const [formStartTime] = useState(Date.now()); // Track when form was loaded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Anti-spam checks
      // 1. Honeypot check - if filled, it's a bot
      if (honeypot) {
        console.log("Spam detected: honeypot filled");
        // Pretend success to fool bots
        toast({
          title: "Message sent!",
          description: "Thank you for reaching out.",
        });
        setFormData({ name: "", email: "", message: "" });
        setIsSubmitting(false);
        return;
      }

      // 2. Time-based check - form must take at least 3 seconds to fill
      const timeTaken = Date.now() - formStartTime;
      if (timeTaken < 3000) {
        toast({
          title: "Slow down!",
          description: "Please take your time filling out the form.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Basic spam keyword check
      const spamKeywords = ['viagra', 'crypto', 'bitcoin', 'forex', 'casino', 'prize', 'winner', 'click here'];
      const messageText = formData.message.toLowerCase();
      const hasSpam = spamKeywords.some(keyword => messageText.includes(keyword));

      if (hasSpam) {
        toast({
          title: "Message flagged",
          description: "Your message contains suspicious content. Please rephrase and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Send email using Formspree - completely free, no backend needed
      // Get form endpoint from environment variable
      const formspreeEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

      if (!formspreeEndpoint) {
        throw new Error('Formspree not configured. Please set VITE_FORMSPREE_ENDPOINT in .env file.');
      }

      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: `Portfolio Contact: Message from ${formData.name}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.errors?.[0]?.message || 'Failed to send message');
      }

      if (onSubmit) {
        onSubmit(formData);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact me directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only handle Ctrl/Cmd+Enter for submit, allow all other keys
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    // Allow space and all other keys to work normally
  };

  return (
    <section className="py-16" data-testid="section-contact">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            CONTACT
          </span>
          <p className="text-foreground/80">
            {showForm
              ? "You can contact me using the form, schedule a meeting, or reach out via the links below."
              : "Schedule a meeting or reach out via the links below."}
          </p>
        </div>

        {(calendarLinks?.link15min || calendarLinks?.link30min) && (
          <div className="mb-10 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Book a meeting:</p>
            <div className="flex flex-wrap gap-4">
              {calendarLinks.link15min && (
                <a
                  href={calendarLinks.link15min}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    15 Min Meeting
                  </Button>
                </a>
              )}
              {calendarLinks.link30min && (
                <a
                  href={calendarLinks.link30min}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    30 Min Meeting
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-10">
            {/* Honeypot field - hidden from users, visible to bots */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

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
            <Button type="submit" disabled={isSubmitting} data-testid="button-send">
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        )}

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

      </div>
    </section>
  );
}
