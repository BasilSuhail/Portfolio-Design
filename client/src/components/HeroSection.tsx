import { useState, useEffect } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { FaXTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa6";

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
  bio: string;
  email: string;
  avatarUrl: string;
  avatarFallback: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export default function HeroSection({
  name,
  title,
  bio,
  email,
  avatarUrl,
  avatarFallback: _avatarFallback,
  socialLinks,
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
    <section className="pt-10 pb-8" data-testid="section-hero">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="flex items-center gap-x-3">
          <div className="shrink-0">
            <img
              className="shrink-0 size-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-neutral-700"
              src={avatarUrl}
              alt={name}
              data-testid="img-avatar"
            />
          </div>

          <div className="grow">
            <h1
              className="text-lg font-medium text-gray-800 dark:text-neutral-200"
              data-testid="text-name"
            >
              {name}
            </h1>
            <p
              className="text-sm text-gray-600 dark:text-neutral-400"
              data-testid="text-title"
            >
              {title}
            </p>
          </div>
        </div>

        {/* About / Bio */}
        <div className="mt-8">
          <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed" data-testid="text-bio">
            {parseBioWithImages(bio).map((part, index) => {
              if (part.type === 'image') {
                return (
                  <img
                    key={index}
                    src={part.content}
                    alt={part.alt || 'inline image'}
                    className="inline-block w-5 h-5 mx-1 align-middle object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                );
              }
              return <span key={index}>{part.content}</span>;
            })}
          </p>

          {/* Contact Links */}
          <ul className="mt-5 flex flex-col gap-y-3">
            {/* Email */}
            <li className="flex items-center gap-x-2.5">
              <Mail className="shrink-0 size-3.5 text-gray-800 dark:text-neutral-200" />
              <button
                onClick={copyEmail}
                className="text-[13px] text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-400 flex items-center gap-1.5"
                data-testid="button-copy-email"
              >
                {email}
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-50" />
                )}
              </button>
              {copied && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Copied!
                </span>
              )}
            </li>

            {/* Social Links */}
            {socialLinks?.twitter && (
              <li className="flex items-center gap-x-2.5">
                <FaXTwitter className="shrink-0 size-3.5 text-gray-800 dark:text-neutral-200" />
                <a
                  className="text-[13px] text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-400"
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{socialLinks.twitter.split('/').pop()}
                </a>
              </li>
            )}

            {socialLinks?.linkedin && (
              <li className="flex items-center gap-x-2.5">
                <FaLinkedinIn className="shrink-0 size-3.5 text-gray-800 dark:text-neutral-200" />
                <a
                  className="text-[13px] text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-400"
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            )}

            {socialLinks?.github && (
              <li className="flex items-center gap-x-2.5">
                <FaGithub className="shrink-0 size-3.5 text-gray-800 dark:text-neutral-200" />
                <a
                  className="text-[13px] text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none dark:text-neutral-500 dark:hover:text-neutral-400"
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{socialLinks.github.split('/').pop()}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
