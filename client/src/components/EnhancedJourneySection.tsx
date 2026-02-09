"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ExternalLink, GraduationCap, Briefcase, Heart, Trees as Tree } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

function TimelineItem({ entry, isLast, index }: { entry: TimelineEntry; isLast: boolean; index: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [projectsOpen, setProjectsOpen] = useState(false)
    const config = typeConfig[entry.type]
    const Icon = config.icon

    const hasExpandableContent = entry.description || entry.skills?.length || entry.achievements?.length || entry.projects?.length

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative pb-8"
            style={{ perspective: "1200px" }}
        >
            {/* Timeline connector line */}
            {!isLast && (
                <div
                    className="absolute left-[19px] top-12 w-px bg-gradient-to-b from-gray-300 via-gray-200 to-transparent dark:from-neutral-600 dark:via-neutral-700 dark:to-transparent"
                    style={{ height: "calc(100% - 20px)" }}
                />
            )}

            {/* The levitating card */}
            <motion.div
                layout
                onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
                animate={{
                    y: isOpen ? -16 : 0,
                    rotateX: isOpen ? -1.5 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 26,
                    mass: 0.7,
                }}
                style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                }}
                className={`
                    relative flex gap-4 p-4 -m-4 rounded-2xl
                    ${hasExpandableContent ? "cursor-pointer" : "cursor-default"}
                    ${isOpen
                        ? "bg-white dark:bg-neutral-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] z-20"
                        : "bg-transparent hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 z-0"
                    }
                    transition-colors duration-300
                `}
            >
                {/* Subtle glow effect when lifted */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"
                    />
                )}

                {/* Timeline dot / Logo */}
                <div className="relative z-10 flex-shrink-0">
                    <motion.div
                        animate={{
                            scale: isOpen ? 1.1 : 1,
                            boxShadow: isOpen
                                ? "0 8px 25px -5px rgba(0,0,0,0.2)"
                                : "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center overflow-hidden
                            bg-white dark:bg-neutral-800 border-2
                            ${isOpen
                                ? "border-gray-300 dark:border-neutral-600"
                                : "border-gray-200 dark:border-neutral-700"
                            }
                        `}
                    >
                        {entry.logoUrl ? (
                            <img src={getOptimizedImageUrl(entry.logoUrl)} alt={entry.organization} className="w-6 h-6 object-contain" width={24} height={24} loading="lazy" decoding="async" />
                        ) : (
                            <Icon className={`w-4 h-4 ${isOpen ? "text-gray-700 dark:text-neutral-200" : "text-gray-400 dark:text-neutral-500"}`} />
                        )}
                    </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 pt-0.5">
                            <h3 className={`font-semibold text-base leading-snug transition-colors duration-200 ${isOpen ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-neutral-200"}`}>
                                {entry.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
                                {entry.organization}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1 font-mono tracking-tight">
                                {entry.period}
                            </p>
                        </div>

                        {hasExpandableContent && (
                            <motion.div
                                animate={{
                                    rotate: isOpen ? 180 : 0,
                                    scale: isOpen ? 1.1 : 1,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="mt-1.5 p-1 rounded-full bg-gray-100 dark:bg-neutral-800"
                            >
                                <ChevronDown className={`w-4 h-4 ${isOpen ? "text-gray-700 dark:text-neutral-200" : "text-gray-400 dark:text-neutral-500"}`} />
                            </motion.div>
                        )}
                    </div>

                    {/* Expandable content with 3D reveal */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{
                                    height: 0,
                                    opacity: 0,
                                    y: -10,
                                }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    height: 0,
                                    opacity: 0,
                                    y: -10,
                                }}
                                transition={{
                                    height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                                    opacity: { duration: 0.3, delay: 0.1 },
                                    y: { duration: 0.3, delay: 0.1 },
                                }}
                                className="overflow-hidden"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.3 }}
                                    className="pt-4 mt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4"
                                >
                                    {/* Description */}
                                    {entry.description && (
                                        <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                                            {entry.description}
                                        </p>
                                    )}

                                    {/* Skills as floating pills */}
                                    {entry.skills && entry.skills.length > 0 && (
                                        <motion.div
                                            initial="hidden"
                                            animate="visible"
                                            variants={{
                                                visible: {
                                                    transition: { staggerChildren: 0.05 }
                                                }
                                            }}
                                            className="flex flex-wrap gap-2"
                                        >
                                            {entry.skills.map((skill, i) => (
                                                <motion.span
                                                    key={skill}
                                                    variants={{
                                                        hidden: { opacity: 0, scale: 0.8, y: 10 },
                                                        visible: { opacity: 1, scale: 1, y: 0 }
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 rounded-full border border-gray-200 dark:border-neutral-700 shadow-sm"
                                                >
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Achievements */}
                                    {entry.achievements && entry.achievements.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs text-gray-500 dark:text-neutral-500 font-semibold uppercase tracking-wider">
                                                Key Achievements
                                            </span>
                                            <ul className="space-y-2">
                                                {entry.achievements.map((achievement, i) => (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.2 + i * 0.05 }}
                                                        className="text-sm text-gray-600 dark:text-neutral-400 pl-4 relative before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-gradient-to-r before:from-blue-400 before:to-purple-400 before:rounded-full"
                                                    >
                                                        {achievement}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Projects/Certifications */}
                                    {entry.projects && entry.projects.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setProjectsOpen(!projectsOpen)
                                                }}
                                                className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors group"
                                            >
                                                <span className="font-semibold uppercase tracking-wider">
                                                    {entry.type === "education" && !entry.organization.includes("UMT") ? "Certifications" : "Projects"} ({entry.projects.length})
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: projectsOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence>
                                                {projectsOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-neutral-700 my-2">
                                                            {entry.projects.map((project, i) => (
                                                                <div key={i} className="py-1.5">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <span className="text-sm text-gray-700 dark:text-neutral-300 font-medium">
                                                                            {project.title}
                                                                        </span>
                                                                        {project.link && (
                                                                            <a
                                                                                href={project.link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 transition-colors"
                                                                            >
                                                                                View
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    {project.description && (
                                                                        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                                                                            {project.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
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
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-neutral-100">
                        My Journey
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                        A timeline of where I{"'"}ve been and what I{"'"}ve learned along the way.
                    </p>
                </div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3 text-gray-400 dark:text-neutral-500 text-sm py-12"
                            >
                                <div className="w-4 h-4 border-2 border-gray-300 dark:border-neutral-600 border-t-gray-500 dark:border-t-neutral-400 rounded-full animate-spin" />
                                Loading timeline...
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {timelineData.map((entry, index) => (
                                    <TimelineItem
                                        key={entry.id}
                                        entry={entry}
                                        isLast={index === timelineData.length - 1}
                                        index={index}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}
