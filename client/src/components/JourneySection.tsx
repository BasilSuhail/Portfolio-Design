"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ExternalLink, GraduationCap, Briefcase, Heart, Trees as Tree } from "lucide-react"

type TimelineItemType = "education" | "work" | "volunteer" | "activity"

interface Project {
  title: string
  description?: string
  link?: string
}

interface TimelineEntry {
  id: string
  type: TimelineItemType
  title: string
  organization: string
  period: string
  logoUrl?: string
  description?: string
  details?: string[]
  skills?: string[]
  achievements?: string[]
  projects?: Project[]
}

// Fallback data used when CMS data is loading or unavailable
const fallbackTimelineData: TimelineEntry[] = [
  {
    id: "msc",
    type: "education",
    title: "MSc Data Science & Business Management",
    organization: "University of Aberdeen",
    period: "Sept 2025 – Present",
    description: "Specializing in automating financial logic and AI integration.",
    skills: ["Advanced Analytics", "Machine Learning", "Business Strategy"],
  },
  {
    id: "dubizzle",
    type: "work",
    title: "Assistant Accountant",
    organization: "Dubizzle Group (Bayut & Dubizzle)",
    period: "Jul 2024 – Aug 2025",
    description: "Managed high-volume reconciliations (1,000+ daily transactions) for a major tech-real estate platform.",
    skills: ["Sage 300", "Reconciliation", "CRM Integration"],
  },
]

const typeConfig: Record<TimelineItemType, { icon: typeof GraduationCap; label: string }> = {
  education: { icon: GraduationCap, label: "Education" },
  work: { icon: Briefcase, label: "Work" },
  volunteer: { icon: Heart, label: "Volunteer" },
  activity: { icon: Tree, label: "Activity" },
}

function TimelineItem({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const config = typeConfig[entry.type]
  const Icon = config.icon

  const hasExpandableContent = entry.description || entry.skills?.length || entry.achievements?.length || entry.projects?.length

  return (
    <div className="relative flex gap-6 pb-8 group">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-[19px] top-12 w-px bg-foreground/10 transition-colors duration-500 group-hover:bg-foreground/20"
          style={{ height: "calc(100% - 24px)" }}
        />
      )}

      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        <button
          onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
          disabled={!hasExpandableContent}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center overflow-hidden
            transition-all duration-300 ease-out
            ${entry.type === "education"
              ? "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
              : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70"
            }
            ${isOpen ? "bg-foreground/10 text-foreground scale-110" : ""}
            ${hasExpandableContent ? "cursor-pointer" : "cursor-default"}
          `}
        >
          {entry.logoUrl ? (
            <img src={entry.logoUrl} alt={entry.organization} className="w-6 h-6 object-contain" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        {/* Header - always visible */}
        <button
          onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
          disabled={!hasExpandableContent}
          className={`
            w-full text-left flex items-start justify-between gap-4
            ${hasExpandableContent ? "cursor-pointer" : "cursor-default"}
          `}
        >
          <div className="min-w-0">
            <h3 className={`
              font-medium transition-colors duration-200
              ${isOpen ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"}
            `}>
              {entry.title}
            </h3>
            <p className="text-sm text-foreground/50 mt-0.5">{entry.organization}</p>
            <p className="text-xs text-foreground/30 mt-1 font-mono">{entry.period}</p>
          </div>

          {hasExpandableContent && (
            <ChevronDown
              className={`
                w-4 h-4 text-foreground/30 flex-shrink-0 mt-1
                transition-transform duration-300 ease-out
                ${isOpen ? "rotate-180 text-foreground/50" : ""}
              `}
            />
          )}
        </button>

        {/* Expandable content */}
        <div
          className={`
            grid transition-all duration-500 ease-out
            ${isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}
          `}
        >
          <div className="overflow-hidden">
            <div className="space-y-4">
              {/* Description */}
              {entry.description && (
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {entry.description}
                </p>
              )}

              {/* Skills */}
              {entry.skills && entry.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs bg-foreground/5 text-foreground/50 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Achievements */}
              {entry.achievements && entry.achievements.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-foreground/40 font-medium">Achievements</span>
                  <ul className="space-y-1">
                    {entry.achievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-foreground/60 pl-3 relative before:absolute before:left-0 before:top-[0.6em] before:w-1 before:h-1 before:bg-foreground/20 before:rounded-full">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Projects/Certifications */}
              {entry.projects && entry.projects.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setProjectsOpen(!projectsOpen)
                    }}
                    className="flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    <span className="font-medium">
                      {entry.type === "education" && !entry.organization.includes("UMT") ? "Certifications" : "Projects"} ({entry.projects.length})
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${projectsOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`
                      grid transition-all duration-300
                      ${projectsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
                    `}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2 pl-3 border-l border-foreground/10">
                        {entry.projects.map((project, i) => (
                          <div key={i} className="py-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm text-foreground/50">{project.title}</span>
                              {project.link && (
                                <a
                                  href={project.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-xs text-foreground/30 mt-0.5">{project.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JourneySection() {
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>(fallbackTimelineData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch("/api/content")
        if (!response.ok) throw new Error("Failed to fetch content")
        const content = await response.json()

        const entries: TimelineEntry[] = []

        // Transform education data
        if (content.education && Array.isArray(content.education)) {
          content.education.forEach((edu: any) => {
            entries.push({
              id: `edu-${edu.id}`,
              type: "education",
              title: edu.degree,
              organization: edu.institution,
              period: edu.dateRange,
              logoUrl: edu.institutionLogoUrl || undefined,
              description: edu.coursework || undefined,
              skills: edu.coursework ? edu.coursework.split(",").map((s: string) => s.trim()).filter((s: string) => s) : undefined,
              achievements: edu.achievements?.filter((a: string) => a.trim()) || undefined,
              projects: edu.certifications?.map((cert: any) => ({
                title: cert.name,
                description: cert.description || undefined,
                link: cert.url || undefined,
              })) || undefined,
            })
          })
        }

        // Transform experiences data
        if (content.experiences && Array.isArray(content.experiences)) {
          content.experiences.forEach((exp: any) => {
            entries.push({
              id: `exp-${exp.id}`,
              type: "work",
              title: exp.role,
              organization: exp.company,
              period: exp.dateRange,
              logoUrl: exp.companyLogoUrl || undefined,
              description: exp.description || undefined,
              skills: exp.customSections?.find((s: any) => s.label?.toLowerCase().includes("focus"))?.items?.map((i: any) => i.name.split(",").map((s: string) => s.trim())).flat() || undefined,
            })
          })
        }

        // Sort by period (most recent first) - simple heuristic based on year
        entries.sort((a, b) => {
          const yearA = parseInt(a.period.match(/\d{4}/)?.[0] || "0")
          const yearB = parseInt(b.period.match(/\d{4}/)?.[0] || "0")
          // Check if present/ongoing
          const isPresentA = a.period.toLowerCase().includes("present") || a.period.toLowerCase().includes("now")
          const isPresentB = b.period.toLowerCase().includes("present") || b.period.toLowerCase().includes("now")
          if (isPresentA && !isPresentB) return -1
          if (!isPresentA && isPresentB) return 1
          return yearB - yearA
        })

        if (entries.length > 0) {
          setTimelineData(entries)
        }
      } catch (error) {
        console.error("Failed to fetch journey content:", error)
        // Keep using fallback data
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <section className="w-full max-w-2xl mx-auto px-6 py-16" data-section="journey">
      <div className="mb-12">
        <h2 className="text-2xl font-medium text-foreground/90">My Journey</h2>
        <p className="text-sm text-foreground/40 mt-2">
          A timeline of where I{"'"}ve been and what I{"'"}ve learned along the way.
        </p>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="text-foreground/40 text-sm">Loading...</div>
        ) : (
          timelineData.map((entry, index) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              isLast={index === timelineData.length - 1}
            />
          ))
        )}
      </div>
    </section>
  )
}
