"use client"

import { useState } from "react"
import { ChevronRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
  title: string
  description: string
  link?: string
  github?: string
  tags?: string[]
}

interface Achievement {
  title: string
  date: string
}

interface Education {
  id: string
  degree: string
  field: string
  institution: string
  period: string
  logo: string
  skills: string[]
  projects: Project[]
  achievements?: Achievement[]
}

const educationData: Education[] = [
  {
    id: "aberdeen",
    degree: "Master of Science",
    field: "Data Science and Business Management",
    institution: "University of Aberdeen",
    period: "Sep 2025 - Present",
    logo: "/aberdeen-logo.png",
    skills: ["Advanced Analytics", "Machine Learning", "Business Strategy"],
    projects: [
      {
        title: "Introduction to Calculus Level 1",
        description: "Foundational calculus concepts including limits, derivatives, and integrals with practical applications in data analysis and optimization problems.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Mathematics", "Wolfram"]
      },
      {
        title: "Special Functions Level 1",
        description: "Deep dive into special mathematical functions used in advanced statistical modeling and machine learning algorithms.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Mathematics", "Statistics"]
      },
      {
        title: "Introduction to Calculus",
        description: "Comprehensive calculus course covering single-variable calculus with emphasis on real-world data science applications.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Mathematics", "Calculus"]
      },
      {
        title: "Introduction to Special Functions",
        description: "Advanced mathematical functions including gamma, beta, and Bessel functions with applications in probability distributions.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Mathematics", "Advanced"]
      },
      {
        title: "A Guide to Programming with the Wolfram Language",
        description: "Comprehensive programming course using Wolfram Language for scientific computing, data manipulation, and visualization.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Programming", "Wolfram"]
      },
      {
        title: "Creative Computation",
        description: "Exploring computational creativity through algorithmic art, generative design, and creative data visualization techniques.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Creative", "Computation"]
      },
      {
        title: "Proficiency in Wolfram Language Level 1",
        description: "Certified proficiency in Wolfram Language fundamentals including syntax, data structures, and basic programming patterns.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Certification", "Wolfram"]
      },
      {
        title: "Proficiency in Mathematica Level 1",
        description: "Hands-on proficiency in Mathematica for symbolic computation, numerical analysis, and scientific visualization.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Certification", "Mathematica"]
      },
      {
        title: "Introduction to Machine Learning in Wolfram Language",
        description: "Applied machine learning using Wolfram Language including classification, regression, clustering, and neural networks.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["ML", "Wolfram"]
      },
      {
        title: "An Elementary Introduction to the Wolfram Language",
        description: "Foundational course in computational thinking and programming using the Wolfram Language ecosystem.",
        link: "https://www.wolfram.com/wolfram-u/",
        tags: ["Programming", "Beginner"]
      }
    ]
  },
  {
    id: "umt",
    degree: "Bachelor's Degree",
    field: "Accounting and Finance",
    institution: "University of Management and Technology - UMT",
    period: "2020 - 2024",
    logo: "/umt-logo.png",
    skills: ["Business Writing", "Microsoft Office", "Sage 50", "Microsoft Excel", "Canva", "Market Research", "Accounting", "Financial Statements", "Interpersonal Communication"],
    achievements: [
      { title: "Rector's Merit Award", date: "Jul 2024" },
      { title: "Dean's Merit Award", date: "Sep 2023" }
    ],
    projects: [
      {
        title: "Fintech - Crypto Currency Wallet App Development",
        description: "Led the development of a comprehensive cryptocurrency wallet application featuring real-time market data, secure transactions, and portfolio tracking. Implemented user authentication, multi-currency support, and intuitive UI/UX design.",
        link: "#",
        github: "#",
        tags: ["Fintech", "Mobile App", "Blockchain"]
      },
      {
        title: "Advanced Corporate Reporting - Financial Statements & IAS Compliance",
        description: "Comprehensive project analyzing corporate financial reporting practices with focus on International Accounting Standards (IAS) compliance. Created detailed financial statements and audit documentation.",
        link: "#",
        tags: ["Finance", "Accounting", "Compliance"]
      },
      {
        title: "Management Accounting & Budgeting - 13 Schedule Budget Analysis",
        description: "Developed a complete 13-schedule budget analysis framework for a manufacturing company, including sales forecasts, production budgets, cash flow projections, and variance analysis reports.",
        link: "#",
        tags: ["Budgeting", "Management Accounting"]
      },
      {
        title: "Internal Control System Design - Financial Operations Optimization",
        description: "Designed and documented comprehensive internal control systems for financial operations, including risk assessment matrices, control activities, and monitoring procedures aligned with COSO framework.",
        link: "#",
        tags: ["Internal Controls", "Risk Management"]
      },
      {
        title: "Audit & Assurance - Internal Control Analysis at The Best Laboratories",
        description: "Conducted thorough internal control analysis for a laboratory company, identifying control weaknesses, recommending improvements, and creating detailed audit documentation and reports.",
        link: "#",
        tags: ["Audit", "Assurance", "Case Study"]
      }
    ]
  }
]

function ProjectItem({ project, isOpen, onToggle, index }: { 
  project: Project
  isOpen: boolean
  onToggle: () => void
  index: number 
}) {
  return (
    <div 
      className="group"
      style={{ 
        animationDelay: `${index * 30}ms`,
        animation: 'fadeSlideIn 0.4s ease-out forwards',
        opacity: 0
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left py-3 flex items-start gap-3 transition-all duration-300"
      >
        <span className={cn(
          "mt-1.5 transition-transform duration-300 ease-out",
          isOpen && "rotate-90"
        )}>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        </span>
        <span className={cn(
          "text-sm transition-colors duration-200",
          isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {project.title}
        </span>
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="pl-6.5 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            {project.description}
          </p>
          
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-full border border-border/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-1">
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                View Project
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                Source
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EducationCard({ education, defaultOpen = false }: { education: Education; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [openProjects, setOpenProjects] = useState<Set<number>>(new Set())

  const toggleProject = (index: number) => {
    setOpenProjects(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className="relative">
      {/* Main Card */}
      <div className={cn(
        "rounded-2xl border border-border/40 transition-all duration-500 ease-out",
        "bg-background/50 backdrop-blur-sm",
        isOpen && "border-border/60"
      )}>
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-5 sm:p-6"
        >
          <div className="flex items-start gap-4">
            {/* Logo placeholder */}
            <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden border border-border/30">
              <img 
                src={education.logo || "/placeholder.svg"} 
                alt={education.institution}
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${education.id === 'aberdeen' ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿' : '🎓'}</span>`
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground leading-snug">
                    {education.degree} - {education.field}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {education.institution}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {education.period}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 transition-transform duration-300 ease-out",
                  isOpen && "rotate-90"
                )} />
              </div>
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-5 sm:px-6 pb-6">
            {/* Subtle divider */}
            <div className="h-px bg-border/40 mb-5" />
            
            {/* Skills */}
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {education.skills.join(', ')}
            </p>

            {/* Achievements */}
            {education.achievements && education.achievements.length > 0 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/50 mb-2">
                  Achievements
                </p>
                <div className="space-y-1">
                  {education.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{achievement.title}</span>
                      <span className="text-xs text-muted-foreground/50">{achievement.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/50 mb-1">
                Academic Projects
              </p>
              <div className="divide-y divide-border/30">
                {education.projects.map((project, idx) => (
                  <ProjectItem
                    key={idx}
                    project={project}
                    isOpen={openProjects.has(idx)}
                    onToggle={() => toggleProject(idx)}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EducationSection() {
  return (
    <section className="w-full min-h-screen py-16 sm:py-24 px-4" id="education">
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-2xl font-medium text-foreground tracking-tight">
            Education
          </h2>
          <p className="text-muted-foreground/70 mt-2 text-sm">
            Academic background and projects
          </p>
        </div>

        {/* Education Cards */}
        <div className="space-y-4">
          {educationData.map((edu, index) => (
            <EducationCard 
              key={edu.id} 
              education={edu} 
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
