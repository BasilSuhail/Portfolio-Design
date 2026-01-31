import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Trophy, Briefcase, Calendar, ChevronRight, Award, Hash } from "lucide-react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TimelineItem {
    id: string;
    date: string;
    title: string;
    subtitle: string;
    logoUrl?: string;
    description?: string;
    tags?: string[];
    stats?: {
        value: number;
        label: string;
        prefix?: string;
        suffix?: string;
    };
    certifications?: Array<{
        name: string;
        url?: string;
        description?: string;
    }>;
    type: "work" | "education";
}

interface SpotlightTimelineProps {
    items: TimelineItem[];
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function SpotlightTimeline({ items }: SpotlightTimelineProps) {
    // Sort (Oldest -> Newest)
    const sortedItems = [...items].sort((a, b) => {
        const getYear = (dateStr: string) => {
            const match = dateStr.match(/\d{4}/);
            return match ? parseInt(match[0]) : 0;
        };
        return getYear(a.date) - getYear(b.date);
    });

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <section className="py-24 px-4 max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100 tracking-tight">
                Professional Chronicle
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
                A detailed archive of my career journey, milestones, and technical evolution.
            </p>

            <div className="relative">
                {/* Timeline Track (Clean line) */}
                <div
                    className="absolute left-8 top-4 bottom-4 w-px bg-gray-200 dark:bg-neutral-800"
                    aria-hidden="true"
                />

                <div className="space-y-4">
                    {sortedItems.map((item) => (
                        <DossierItem
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            onClick={(e) => toggleExpand(item.id, e)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

// -----------------------------------------------------------------------------
// Dossier Item Component
// -----------------------------------------------------------------------------

function DossierItem({
    item,
    isExpanded,
    onClick
}: {
    item: TimelineItem;
    isExpanded: boolean;
    onClick: (e: React.MouseEvent) => void;
}) {

    const initials = item.subtitle.substring(0, 2).toUpperCase();

    return (
        <motion.div
            layout
            onClick={!isExpanded ? onClick : undefined}
            className={cn(
                "relative rounded-xl transition-all duration-500 group pl-2",
                // Default: Minimal List Row
                !isExpanded && "cursor-pointer hover:bg-white/60 dark:hover:bg-neutral-900/60 hover:shadow-sm border border-transparent",
                // Expanded: The "Dossier" Card
                isExpanded && "bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 my-8 z-10"
            )}
        >
            <motion.div layout className={cn("p-4", isExpanded && "p-8")}>

                {/* HEADER SECTION */}
                <div className="flex gap-6 items-start">
                    {/* Logo (Timeline Anchor) */}
                    <motion.div layout className="relative z-20 flex-shrink-0">
                        <div className={cn(
                            "rounded-full border-4 border-white dark:border-neutral-950 bg-gray-50 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shadow-sm transition-all duration-500",
                            isExpanded ? "w-20 h-20 shadow-lg scale-110" : "w-12 h-12"
                        )}>
                            {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.subtitle} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-gray-400 dark:text-neutral-500">{initials}</span>
                            )}
                        </div>
                    </motion.div>

                    {/* Title Block */}
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <motion.h3 layout className={cn(
                                    "font-bold text-gray-900 dark:text-gray-100 transition-all",
                                    isExpanded ? "text-2xl mb-1" : "text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                )}>
                                    {item.title}
                                </motion.h3>
                                <motion.div layout className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
                                    <span className={cn("font-medium", isExpanded && "text-lg text-emerald-600 dark:text-emerald-400")}>
                                        {item.subtitle}
                                    </span>
                                    {!isExpanded && (
                                        <>
                                            <span>•</span>
                                            <span className="font-mono text-xs">{item.date}</span>
                                        </>
                                    )}
                                </motion.div>
                            </div>

                            {/* Collapsed Date / Expanded Close */}
                            {isExpanded ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClick(e); }} // Pass event to close
                                    className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            ) : (
                                <ChevronRight className="text-gray-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                            )}
                        </div>
                    </div>
                </div>

                {/* EXPANDED CONTENT (THE DOSSIER) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        >
                            <div className="pt-8 mt-2 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-12">

                                {/* LEFT COLUMN: NARRATIVE (7/12) */}
                                <div className="md:col-span-7 space-y-8">

                                    {/* Metadata Row */}
                                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-neutral-400 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} /> <span>{item.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} /> <span>Full-time</span>
                                        </div>
                                    </div>

                                    {/* The Story */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Hash size={12} className="text-emerald-500" /> Impact Narrative
                                        </h4>
                                        <p className="text-lg leading-loose text-gray-700 dark:text-neutral-300 font-serif">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Attachments / Certs */}
                                    {item.certifications && item.certifications.length > 0 && (
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-6 border border-gray-100 dark:border-neutral-800">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Award size={14} /> Credentials & Artifacts
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {item.certifications.map((cert, idx) => {
                                                    const content = (
                                                        <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                            {cert.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    );

                                                    if (cert.url) {
                                                        return (
                                                            <a key={idx} href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 shadow-sm hover:border-emerald-500 transition-colors">
                                                                {content}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium truncate" title={cert.name}>{cert.name}</div>
                                                                    <div className="text-xs text-emerald-600 dark:text-emerald-400">View Credential</div>
                                                                </div>
                                                            </a>
                                                        );
                                                    }
                                                    return (
                                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 shadow-sm cursor-default">
                                                            {content}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium truncate" title={cert.name}>{cert.name}</div>
                                                                <div className="text-xs text-gray-400">Verified</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT COLUMN: SIDEBAR (5/12) */}
                                <div className="md:col-span-5 space-y-8">

                                    {/* Hero Metric */}
                                    {item.stats && (
                                        <div className="bg-emerald-600 dark:bg-emerald-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group/card">
                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover/card:scale-150 transition-transform duration-700" />
                                            <div className="relative z-10">
                                                <div className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-1">Key Achievement</div>
                                                <div className="text-4xl font-bold tracking-tight">
                                                    {item.stats.prefix}{item.stats.value.toLocaleString()}{item.stats.suffix}
                                                </div>
                                                <div className="text-emerald-50 mt-1 font-medium">{item.stats.label}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills Cloud */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
                                            Technology & Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags?.map(tag => (
                                                <span key={tag} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-md border border-gray-200 dark:border-neutral-700">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
}
