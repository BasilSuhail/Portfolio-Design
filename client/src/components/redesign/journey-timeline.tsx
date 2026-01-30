"use client"

import { useState } from "react"
import { ChevronDown, ExternalLink, GraduationCap, Briefcase, Heart, Trees as Tree } from "lucide-react"

type TimelineItemType = "education" | "work" | "volunteer" | "activity"

interface Project {
  title: string
  description?: string
  link?: string
  period?: string
  skills?: string[]
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
      {
        title: "Fintech - Semester End Project",
        period: "Oct 2023 - Feb 2024",
        description: "Assigned by our resource person, Muhammad Mobeen Ajmal, our fintech project aimed to develop a Crypto Currency Wallet app as a pilot initiative to demonstrate the viability and advantages of using cryptocurrency over traditional forms of payment in Pakistan. The app targeted all age groups and aimed to spread awareness and trust by reaching smaller shops and businesses for safe and convenient fund transfers.",
        skills: ["Flow Charts", "Market Research"],
        link: "#"
      },
      {
        title: "Advanced Corporate Reporting",
        period: "Dec 2023 - Jan 2024",
        description: "In this project, we embarked on an accounting journey, leveraging guidelines such as IAS-8, IAS-17, IAS-20, IAS-33 and real-world business scenarios. We navigated through various tasks, including adjusting asset useful life, accounting for government grants, and issuing preference shares convertible to ordinary shares. We efficiently managed over 57 general entries and disclosed contingencies.",
        skills: ["Financial Statements", "Microsoft Excel", "Market Research"],
        link: "#"
      },
      {
        title: "Management Accounting & Budgeting - Semester End Project",
        period: "Jan 2023 - Feb 2023",
        description: "This project required us to create the future outlook estimated budget of a company using 13 schedules including Sales, Production, Direct-Material, and Cash Budgets. The company selected was Shahtaj Sugar Mills Limited, a public listed sugar manufacturer. We estimated budgets using inflation and growth rates, ensuring accuracy in future estimations.",
        skills: ["Planning Budgeting & Forecasting", "Time Management", "Market Research"],
        link: "#"
      },
      {
        title: "Streamlining Financial Operations: A Comprehensive Internal Control System Design",
        period: "Nov 2022 - Feb 2023",
        description: "Involved a meticulous examination and documentation of an internal control framework to bolster the integrity and efficiency of financial processes. Utilizing 'Draw.io,' we mapped out procedures across crucial operational domains including cash, inventory, sales, and payroll, aiming to optimize operations and mitigate risks.",
        skills: ["Flow Charts", "Market Research"],
        link: "#"
      },
      {
        title: "Audit and Assurance - Internal Control Analysis",
        period: "Nov 2022 - Dec 2022",
        description: "During our assessment of 'The Best Laboratories' at Sundar Industrial Estate, we meticulously examined their internal controls to ensure compliance with standard operating procedures (SOPs) and regulatory guidelines. We evaluated equipment cleanliness, production processes, packing procedures, and warehouse security.",
        link: "#"
      },
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
  const hasDetails = project.description || project.link || project.skills?.length

  return (
    <div className="group/project">
      <button
        onClick={() => hasDetails && setIsOpen(!isOpen)}
        disabled={!hasDetails}
        className={`
          w-full text-left py-2
          ${hasDetails ? "cursor-pointer" : "cursor-default"}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground/60 group-hover/project:text-foreground/80 transition-colors">
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
        </div>
        {project.period && (
          <p className="text-xs text-foreground/30 mt-0.5 font-mono">{project.period}</p>
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
            <div className="pl-0 pb-3 space-y-3">
              {project.description && (
                <p className="text-xs text-foreground/50 leading-relaxed">
                  {project.description}
                </p>
              )}

              {project.skills && project.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map(skill => (
                    <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-foreground/5 text-foreground/40 border border-foreground/5">
                      {skill}
                    </span>
                  ))}
                </div>
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
