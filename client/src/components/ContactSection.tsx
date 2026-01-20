import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetalButton } from "@/components/ui/metal-button";

interface ContactSectionProps {
  email?: string;
}

export function ContactSection({ email }: ContactSectionProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formStartTime] = useState(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Anti-spam checks
      if (honeypot) {
        toast({
          title: "Message sent!",
          description: "Thank you for reaching out.",
        });
        setFormData({ name: "", email: "", message: "" });
        setIsSubmitting(false);
        return;
      }

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

      const formspreeEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

      if (!formspreeEndpoint) {
        throw new Error('Formspree not configured.');
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

  return (
    <section className="mt-10 sm:mt-14" data-section="contact">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 font-medium text-gray-800 dark:text-neutral-200">
          Contact Me
        </h2>

        {email && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5 flex items-center gap-2">
            <Mail className="size-4" />
            <a
              href={`mailto:${email}`}
              className="underline hover:text-gray-800 dark:hover:text-neutral-200"
            >
              {email}
            </a>
          </p>
        )}

        {/* Contact Form - Preline Style */}
        <form onSubmit={handleSubmit}>
          {/* Honeypot field */}
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

          <div className="p-1.5 flex flex-col sm:flex-row items-center gap-2 border border-gray-200 rounded-lg dark:border-neutral-700">
            <div className="relative w-full">
              <label htmlFor="contact-name" className="sr-only">Name</label>
              <input
                type="text"
                id="contact-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="py-2 px-3 block w-full border-transparent rounded-lg text-sm focus:border-transparent focus:ring-transparent bg-transparent text-gray-800 placeholder-gray-400 dark:text-neutral-200 dark:placeholder-neutral-500"
                placeholder="Your name"
              />
            </div>

            <div className="relative w-full">
              <label htmlFor="contact-email" className="sr-only">Email</label>
              <input
                type="email"
                id="contact-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="py-2 px-3 block w-full border-transparent rounded-lg text-sm focus:border-transparent focus:ring-transparent bg-transparent text-gray-800 placeholder-gray-400 dark:text-neutral-200 dark:placeholder-neutral-500"
                placeholder="Your email"
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="contact-message" className="sr-only">Message</label>
            <textarea
              id="contact-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
              className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-gray-300 focus:ring-0 bg-transparent text-gray-800 placeholder-gray-400 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-neutral-600"
              placeholder="Your message"
            />
          </div>

          <div className="mt-4">
            <MetalButton
              type="submit"
              disabled={isSubmitting}
              variant="default"
            >
              <Send className="size-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </MetalButton>
          </div>
        </form>
      </div>
    </section>
  );
}
