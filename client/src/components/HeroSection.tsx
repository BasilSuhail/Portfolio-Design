import { useState, useEffect } from "react";
import { Mail, Copy, Check, MapPin } from "lucide-react";
import TypewriterText from "./TypewriterText";
// canvas-confetti loaded lazily on first email copy click
import { getOptimizedImageUrl } from "@/lib/imageUtils";

type BioPart = { type: 'text'; content: string } | { type: 'image'; content: string; alt: string };

// Helper function to parse bio text with inline images
function parseBioWithImages(bio: string): BioPart[] {
  const parts: BioPart[] = [];
  const regex = /\[img:(.*?)(?::(.*?))?\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(bio)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: bio.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', content: match[1], alt: match[2] || 'inline image' });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < bio.length) {
    parts.push({ type: 'text', content: bio.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: bio }];
}

interface HeroSectionProps {
  name: string;
  title: string;
  titles?: string[];
  bio: string;
  email: string;
  avatarUrl: string;
  avatarFallback: string;
  status?: string;
  location?: string;
}

export default function HeroSection({
  name,
  title,
  titles,
  bio,
  email,
  avatarUrl,
  avatarFallback: _avatarFallback,
  status,
  location,
}: HeroSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = (e?: React.MouseEvent<HTMLButtonElement>) => {
    navigator.clipboard.writeText(email);
    setCopied(true);

    // Calculate origin from clicked button position, or use center if via keyboard
    let originX = 0.5;
    let originY = 0.5;
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    }

    // Random confetti burst from the email button (loaded lazily)
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        particleCount: Math.floor(randomInRange(50, 100)),
        origin: { x: originX, y: originY },
      });
    });

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
    <section className="pt-10 sm:pt-12 pb-8" data-section="hero" data-testid="section-hero">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Portrait + headline */}
        <div className="flex items-center gap-x-4">
          <img
            className="shrink-0 size-16 sm:size-[72px] rounded-full object-cover ring-1 ring-white/80 shadow-[0_12px_30px_-10px_rgba(70,55,25,.35)] dark:ring-white/15 dark:shadow-[0_12px_30px_-10px_rgba(0,0,0,.8)]"
            src={getOptimizedImageUrl(avatarUrl)}
            alt={name}
            width={72}
            height={72}
            fetchPriority="high"
            decoding="sync"
            data-testid="img-avatar"
          />

          <div className="min-w-0">
            {location && (
              <p className="mb-1 flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
                <MapPin className="size-3" />
                {location}
              </p>
            )}
            <h1
              className="text-2xl sm:text-[2rem] font-semibold tracking-tight leading-tight whitespace-nowrap text-gray-900 dark:text-neutral-100"
              data-testid="text-title"
            >
              <span className="sr-only">{name}, </span>
              {titles && titles.length > 0 ? (
                <TypewriterText
                  phrases={titles}
                  typingSpeed={80}
                  deletingSpeed={40}
                  pauseDuration={2000}
                />
              ) : (
                title
              )}
            </h1>
          </div>
        </div>

        {/* Bio */}
        <p
          className="mt-7 text-[15px] sm:text-base leading-relaxed text-gray-600 dark:text-neutral-400"
          data-testid="text-bio"
        >
          {parseBioWithImages(bio).map((part, index) => {
            if (part.type === 'image') {
              return (
                <img
                  key={index}
                  src={getOptimizedImageUrl(part.content)}
                  alt={part.alt || 'inline image'}
                  className="inline-block w-5 h-5 mx-1 align-middle object-contain"
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                />
              );
            }
            return <span key={index}>{part.content}</span>;
          })}
        </p>

        {/* Email + status */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {email && (
            <button
              onClick={copyEmail}
              className="glass-bar group inline-flex max-w-full items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-medium text-gray-800 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-neutral-200"
              aria-label={`Copy email address ${email}`}
              data-testid="button-copy-email"
            >
              <Mail className="shrink-0 size-3.5 text-gray-500 dark:text-neutral-400" />
              <span className="truncate">{email}</span>
              <span className="ms-1 flex items-center gap-1 border-s border-black/10 ps-3 text-xs text-gray-500 dark:border-white/15 dark:text-neutral-400">
                {copied ? (
                  <>
                    <Check className="size-3.5 text-green-600 dark:text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </span>
            </button>
          )}

          {status && (
            <p className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {status}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
