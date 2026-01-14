import { useState } from "react"
import { Github, Linkedin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Link } from "wouter"

export function Footer() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [honeypot, setHoneypot] = useState("")
  const [formStartTime] = useState(Date.now())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Anti-spam checks
      if (honeypot) {
        toast({
          title: "Message sent!",
          description: "Thank you for reaching out.",
        })
        setFormData({ name: "", email: "", message: "" })
        setIsSubmitting(false)
        return
      }

      const timeTaken = Date.now() - formStartTime
      if (timeTaken < 3000) {
        toast({
          title: "Slow down!",
          description: "Please take your time filling out the form.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const spamKeywords = ['viagra', 'crypto', 'bitcoin', 'forex', 'casino', 'prize', 'winner', 'click here']
      const messageText = formData.message.toLowerCase()
      const hasSpam = spamKeywords.some(keyword => messageText.includes(keyword))

      if (hasSpam) {
        toast({
          title: "Message flagged",
          description: "Your message contains suspicious content. Please rephrase and try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const formspreeEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT

      if (!formspreeEndpoint) {
        throw new Error('Formspree not configured.')
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
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.errors?.[0]?.message || 'Failed to send message')
      }

      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      })

      setFormData({ name: "", email: "", message: "" })
    } catch (error) {
      console.error('Contact form error:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact me directly.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const quickLinks = [
    { label: "Projects", id: "projects" },
    { label: "Blogs", id: "writing" },
    { label: "Gallery", href: "/gallery" },
  ]

  const infoLinks = [
    { label: "About", id: "hero" },
    { label: "Experience", id: "experience" },
    { label: "Education", id: "education" },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-12">
      <footer className="mx-auto max-w-5xl rounded-t-2xl bg-[#1e293b]">
        <div className="px-8 py-14 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Contact Form - Left side */}
            <div>
              <h3 className="text-2xl font-semibold text-white">Get in Touch</h3>
              <p className="mb-6 mt-2 text-sm text-[#94a3b8]">Book a meeting or drop me a message.</p>

              {/* Meeting buttons */}
              <div className="mb-6 flex gap-3">
                <Button
                  size="sm"
                  className="gap-2 rounded-full bg-[#4ade80] px-5 text-[#0f172a] hover:bg-[#22c55e]"
                  asChild
                >
                  <a href="https://cal.com/basilsuhail/15min" target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4" />
                    15 Min
                  </a>
                </Button>
                <Button
                  size="sm"
                  className="gap-2 rounded-full border-[#475569] bg-transparent px-5 text-[#e2e8f0] hover:bg-[#334155] hover:text-white"
                  asChild
                >
                  <a href="https://cal.com/basilsuhail/30min" target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4" />
                    30 Min
                  </a>
                </Button>
              </div>

              {/* Contact form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-10 border-0 border-b border-[#475569] bg-transparent text-sm text-white placeholder:text-[#64748b] focus-visible:border-[#4ade80] focus-visible:ring-0 rounded-none px-0"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-10 border-0 border-b border-[#475569] bg-transparent text-sm text-white placeholder:text-[#64748b] focus-visible:border-[#4ade80] focus-visible:ring-0 rounded-none px-0"
                  />
                </div>
                <Textarea
                  placeholder="Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="min-h-[80px] resize-none border-0 border-b border-[#475569] bg-transparent text-sm text-white placeholder:text-[#64748b] focus-visible:border-[#4ade80] focus-visible:ring-0 rounded-none px-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="mt-2 rounded-full bg-[#4ade80] px-6 text-[#0f172a] hover:bg-[#22c55e]"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>

            {/* Links and Social - Right side */}
            <div>
              {/* Link columns */}
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#64748b]">Links</h4>
                  <ul className="space-y-3">
                    {quickLinks.map((link) => (
                      <li key={link.label}>
                        {link.href ? (
                          <Link href={link.href}>
                            <a className="text-sm text-[#cbd5e1] transition-colors hover:text-white">
                              {link.label}
                            </a>
                          </Link>
                        ) : (
                          <button
                            onClick={() => scrollToSection(link.id!)}
                            className="text-sm text-[#cbd5e1] transition-colors hover:text-white"
                          >
                            {link.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#64748b]">Info</h4>
                  <ul className="space-y-3">
                    {infoLinks.map((link) => (
                      <li key={link.label}>
                        <button
                          onClick={() => scrollToSection(link.id)}
                          className="text-sm text-[#cbd5e1] transition-colors hover:text-white"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-12">
                <a
                  href="https://github.com/BasilSuhail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#94a3b8] transition-colors hover:text-white"
                >
                  <Github className="h-5 w-5" />
                  <span>@BasilSuhail</span>
                </a>
                <a
                  href="https://linkedin.com/in/basilsuhail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#94a3b8] transition-colors hover:text-white"
                >
                  <Linkedin className="h-5 w-5" />
                  <span>/in/basilsuhail</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#334155] pt-8 sm:flex-row">
            <p className="text-sm font-semibold text-white">BasilSuhail</p>
            <p className="text-xs text-[#64748b]">© 2026 All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
