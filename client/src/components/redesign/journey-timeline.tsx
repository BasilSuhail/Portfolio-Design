"use client"

import { useState } from "react"
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
  description?: string
  details?: string[]
  skills?: string[]
  achievements?: string[]
  projects?: Project[]
}

const timelineData: TimelineEntry[] = [
  {
    id: "msc",
    type: "education",
    title: "MSc Data Science & Business Management",
    organization: "University of Aberdeen",
    period: "Sept 2025 – Present",
    description: "Specializing in automating financial logic and AI integration.",
    skills: ["Advanced Analytics", "Machine Learning", "Business Strategy"],
    projects: [
      { title: "Introduction to Calculus Level 1", link: "#" },
      { title: "Special Functions Level 1", link: "#" },
      { title: "A Guide to Programming with Wolfram Language", link: "#" },
      { title: "Creative Computation", link: "#" },
      { title: "Proficiency in Wolfram Language Level 1", link: "#" },
      { title: "Proficiency in Mathematica Level 1", link: "#" },
      { title: "Introduction to Machine Learning in Wolfram Language", link: "#" },
    ],
  },
  {
    id: "dubizzle",
    type: "work",
    title: "Assistant Accountant",
    organization: "Dubizzle Group (Bayut & Dubizzle)",
    period: "Jul 2024 – Aug 2025",
    description: "Managed high-volume reconciliations (1,000+ daily transactions) for a major tech-real estate platform, optimizing workflows between Sage 300 and CRM systems.",
    skills: ["Sage 300", "Reconciliation", "CRM Integration"],
  },
  {
    id: "bsc",
    type: "education",
    title: "BSc Accounting & Finance",
    organization: "University of Management & Technology (UMT)",
    period: "Sept 2020 – Jul 2024",
    description: "Graduated with Rector's Merit Award.",
    skills: ["Business Writing", "Microsoft Office", "Sage 50", "Financial Statements", "Market Research"],
    achievements: ["Rector's Merit Award (Jul 2024)", "Dean's Merit Award (Sep 2023)"],
    projects: [
      { title: "Fintech - Crypto Currency Wallet App Development", description: "Developed a cryptocurrency wallet application focusing on user experience and security.", link: "#" },
      { title: "Advanced Corporate Reporting - Financial Statements & IAS Compliance", description: "Comprehensive analysis of financial reporting standards and compliance frameworks.", link: "#" },
      { title: "Management Accounting & Budgeting - 13 Schedule Budget Analysis", description: "Created detailed budget schedules for organizational financial planning.", link: "#" },
      { title: "Internal Control System Design - Financial Operations Optimization", description: "Designed internal controls to optimize financial operations and reduce risk.", link: "#" },
      { title: "Audit & Assurance - Internal Control Analysis at The Best Laboratories", description: "Conducted thorough internal control analysis for a laboratory setting.", link: "#" },
    ],
  },
  {
    id: "parwaaz",
    type: "work",
    title: "Finance Intern (Co-op)",
    organization: "Parwaaz Financial Services Ltd",
    period: "Jun 2023 – Jun 2024",
    description: "This wasn't a standard role. I was awarded this Co-Op placement through a competitive selection process by the Corporate Linkages & Placements Department of The University of Management and Technology. Because of that trust, I was given real responsibility immediately. I managed the monthly financial close for the company, tracked depreciation for over 200 assets, and handled the benefits for the whole team. I also got to play 'detective' with the data, running variance analysis on client accounts to give senior management a clear picture of how the business was actually performing.",
    skills: ["Variance Analysis", "Microsoft Dynamics", "Strategic Insights"],
  },
  {
    id: "falcon",
    type: "activity",
    title: "Event Coordinator & Athlete",
    organization: "Falcon Triathlon Club",
    period: "Jan 2023 – Sept 2025",
    description: "Managed logistics for national endurance events while training as a triathlete.",
    skills: ["Event Management", "Team Coordination", "Endurance Training"],
  },
  {
    id: "sdi",
    type: "volunteer",
    title: "Social Worker",
    organization: "Sustainable Development Initiative",
    period: "Sept 2021 – Oct 2021",
    description: "Led a neighborhood sustainability drive, coordinating the plantation of 200+ trees.",
    skills: ["Community Outreach", "Environmental Awareness", "Project Coordination"],
  },
  {
    id: "vinkimya",
    type: "work",
    title: "Supply Chain & Accounts Intern",
    organization: "Vinkimya (Pvt) Ltd",
    period: "Jun 2020 – Aug 2020",
    description: "Gained practical exposure to warehouse management, stock control, and supply chain logistics.",
    skills: ["Warehouse Management", "Stock Control", "Supply Chain"],
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
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${entry.type === "education" 
              ? "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground" 
              : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70"
            }
            ${isOpen ? "bg-foreground/10 text-foreground scale-110" : ""}
            ${hasExpandableContent ? "cursor-pointer" : "cursor-default"}
          `}
        >
          <Icon className="w-4 h-4" />
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
                      className="text-xs px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Achievements */}
              {entry.achievements && entry.achievements.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wider text-foreground/30">Achievements</p>
                  {entry.achievements.map((achievement) => (
                    <p key={achievement} className="text-sm text-foreground/60">
                      {achievement}
                    </p>
                  ))}
                </div>
              )}

              {/* Projects - nested expandable */}
              {entry.projects && entry.projects.length > 0 && (
                <div className="border-t border-foreground/5 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setProjectsOpen(!projectsOpen)
                    }}
                    className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground/30 hover:text-foreground/50 transition-colors"
                  >
                    <span>Projects ({entry.projects.length})</span>
                    <ChevronDown 
                      className={`
                        w-3 h-3 transition-transform duration-300
                        ${projectsOpen ? "rotate-180" : ""}
                      `}
                    />
                  </button>
                  
                  <div 
                    className={`
                      grid transition-all duration-400 ease-out
                      ${projectsOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}
                    `}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3">
                        {entry.projects.map((project, idx) => (
                          <ProjectItem key={idx} project={project} />
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

function ProjectItem({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasDetails = project.description || project.link

  return (
    <div className="group/project">
      <button
        onClick={() => hasDetails && setIsOpen(!isOpen)}
        disabled={!hasDetails}
        className={`
          w-full text-left flex items-center justify-between gap-3 py-1.5
          ${hasDetails ? "cursor-pointer" : "cursor-default"}
        `}
      >
        <span className="text-sm text-foreground/50 group-hover/project:text-foreground/70 transition-colors">
          {project.title}
        </span>
        {hasDetails && (
          <ChevronDown 
            className={`
              w-3 h-3 text-foreground/20 flex-shrink-0
              transition-transform duration-200
              ${isOpen ? "rotate-180" : ""}
            `}
          />
        )}
      </button>
      
      {hasDetails && (
        <div 
          className={`
            grid transition-all duration-300 ease-out
            ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
          `}
        >
          <div className="overflow-hidden">
            <div className="pl-0 pb-2 space-y-2">
              {project.description && (
                <p className="text-xs text-foreground/40 leading-relaxed">
                  {project.description}
                </p>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  View project
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function JourneyTimeline() {
  return (
    <section className="w-full max-w-2xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h2 className="text-2xl font-medium text-foreground/90">My Journey</h2>
        <p className="text-sm text-foreground/40 mt-2">
          A timeline of where I{"'"}ve been and what I{"'"}ve learned along the way.
        </p>
      </div>

      <div className="relative">
        {timelineData.map((entry, index) => (
          <TimelineItem 
            key={entry.id} 
            entry={entry} 
            isLast={index === timelineData.length - 1}
          />
        ))}
      </div>
    </section>
  )
}
