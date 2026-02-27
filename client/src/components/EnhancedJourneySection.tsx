"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ExternalLink, GraduationCap, Briefcase, Heart, Trees as Tree, TrendingUp, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getOptimizedImageUrl } from "@/lib/imageUtils"

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

/** Extract a display year from a period string like "Jul 2024 - Aug 2025" or "Sept 2025 – Present" */
function extractYear(period: string): string {
    const isPresent = period.toLowerCase().includes("present") || period.toLowerCase().includes("now")
    if (isPresent) return "Now"
    // Grab all years and return the first one
    const years = period.match(/\d{4}/g)
    return years ? years[0] : ""
}

function TimelineItem({
    entry,
    isExpanded,
    onToggle,
    isLast,
}: {
    entry: TimelineEntry
    isExpanded: boolean
    onToggle: () => void
    isLast: boolean
}) {
    const [projectsOpen, setProjectsOpen] = useState(false)
    const isWork = entry.type === "work"
    const Icon = typeConfig[entry.type]?.icon || Briefcase
    const year = extractYear(entry.period)

    return (
        <div className="group">
            {/* Clickable header row */}
            <button
                onClick={onToggle}
                className="flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-lg px-3 -mx-3"
            >
                {/* Year pill */}
                <span className="mt-0.5 flex h-7 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {year}
                </span>

                {/* Icon / Logo */}
                <div
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full overflow-hidden ${entry.logoUrl
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : isWork
                            ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                        }`}
                >
                    {entry.logoUrl ? (
                        <img
                            src={getOptimizedImageUrl(entry.logoUrl)}
                            alt={entry.organization}
                            className="w-5 h-5 object-contain"
                        />
                    ) : (
                        <Icon className="size-3.5" />
                    )}
                </div>

                {/* Title area */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {entry.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {entry.organization}
                    </p>
                </div>

                {/* Expand indicator */}
                <ChevronDown
                    className={`mt-1 size-4 shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Expandable content */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${isExpanded
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="pb-4 pl-[7.5rem] pr-3">
                        {entry.description && (
                            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                                {entry.description}
                            </p>
                        )}

                        {/* Achievements shown as impact lines */}
                        {entry.achievements && entry.achievements.filter(a => a.trim()).length > 0 && (
                            <div className="mt-3 space-y-1">
                                {entry.achievements.filter(a => a.trim()).map((achievement, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                        <TrendingUp className="size-3.5" />
                                        <span>{achievement}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {entry.skills && entry.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {entry.skills.map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="px-2 py-0.5 text-[10px] font-normal"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Projects / Certifications */}
                        {entry.projects && entry.projects.length > 0 && (() => {
                            const isUMT = entry.organization.includes("UMT")
                            const isSelfDev = entry.title.includes("Continuous Learning")
                            const alwaysExpanded = isUMT || isSelfDev
                            const label = isUMT ? "Projects" : isSelfDev ? "Courses" : "Certifications"

                            const projectsList = (
                                <div className="space-y-2 pl-3 border-l border-neutral-200 dark:border-neutral-700">
                                    {entry.projects!.map((project, i) => (
                                        <div key={i} className="py-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm text-neutral-600 dark:text-neutral-400">{project.title}</span>
                                                {project.link && (
                                                    <a
                                                        href={project.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0"
                                                    >
                                                        View
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            {project.description && (
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 whitespace-pre-line">{project.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )

                            if (alwaysExpanded) {
                                // UMT / Continuous Learning: always visible
                                return (
                                    <div className="mt-3 space-y-2">
                                        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                                            {label} ({entry.projects!.length})
                                        </span>
                                        {projectsList}
                                    </div>
                                )
                            }

                            // Everything else: collapsible, labeled "Certifications"
                            return (
                                <div className="mt-3 space-y-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setProjectsOpen(!projectsOpen)
                                        }}
                                        className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    >
                                        <span className="font-medium">
                                            {label} ({entry.projects!.length})
                                        </span>
                                        <ChevronDown
                                            className={`w-3 h-3 transition-transform duration-200 ${projectsOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ${projectsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                    >
                                        <div className="overflow-hidden">
                                            {projectsList}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </div>

            {/* Separator between items */}
            {!isLast && <Separator />}
        </div>
    )
}

export default function JourneySection() {
    const [timelineData, setTimelineData] = useState<TimelineEntry[]>(fallbackTimelineData)
    const [isLoading, setIsLoading] = useState(true)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    useEffect(() => {
        async function fetchContent() {
            try {
                const response = await fetch("/api/content")
                if (!response.ok) throw new Error("Failed to fetch content")
                const content = await response.json()

                const entries: TimelineEntry[] = []

                if (content.education && Array.isArray(content.education)) {
                    content.education.forEach((edu: any) => {
                        entries.push({
                            id: `edu-${edu.id}`,
                            type: "education",
                            title: edu.degree,
                            organization: edu.institution,
                            period: edu.dateRange,
                            logoUrl: edu.institutionLogoUrl || undefined,
                            description: edu.description || edu.coursework || undefined,
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

                entries.sort((a, b) => {
                    const yearA = parseInt(a.period.match(/\d{4}/)?.[0] || "0")
                    const yearB = parseInt(b.period.match(/\d{4}/)?.[0] || "0")
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
            } finally {
                setIsLoading(false)
            }
        }

        fetchContent()
    }, [])

    return (
        <section className="mt-10 sm:mt-14" data-section="journey">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                        My Journey
                    </h2>
                </div>

                <div className="relative">
                    {isLoading ? (
                        <div className="flex items-center gap-3 text-gray-400 dark:text-neutral-500 text-sm py-12">
                            <div className="w-4 h-4 border-2 border-gray-300 dark:border-neutral-600 border-t-gray-500 dark:border-t-neutral-400 rounded-full animate-spin" />
                            Loading timeline...
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0">
                            {timelineData.map((entry, index) => (
                                <TimelineItem
                                    key={entry.id}
                                    entry={entry}
                                    isExpanded={expandedIndex === index}
                                    onToggle={() =>
                                        setExpandedIndex(expandedIndex === index ? null : index)
                                    }
                                    isLast={index === timelineData.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>


            </div>
        </section>
    )
}
