import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollapsibleSectionProps {
    id?: string;             // data-toc-id for TOC tracking
    icon?: React.ReactNode;  // icon shown in header
    title: string;
    badge?: string;          // small secondary badge text
    open: boolean;
    onToggle: () => void;
    preview?: React.ReactNode; // teaser shown when collapsed
    children: React.ReactNode;
    /** If true, removes the white card border wrapper (useful for sections that
     *  already have their own background/padding, e.g. Home page sections). */
    bare?: boolean;
}

export function CollapsibleSection({
    id,
    icon,
    title,
    badge,
    open,
    onToggle,
    preview,
    children,
    bare = false,
}: CollapsibleSectionProps) {
    const wrapper = bare
        ? "overflow-hidden"
        : "rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden";

    return (
        <div data-toc-id={id} className={wrapper}>
            {/* ── Header row (always visible) ── */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {icon && <span className="text-violet-500 flex-shrink-0">{icon}</span>}
                    <span className="text-sm font-medium text-gray-800 dark:text-neutral-200 truncate">
                        {title}
                    </span>
                    {badge && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex-shrink-0">
                            {badge}
                        </Badge>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* ── Preview strip (collapsed only) ── */}
            {preview && !open && (
                <div className="px-5 pb-3 text-xs text-gray-400 dark:text-neutral-500 border-t border-gray-50 dark:border-neutral-800/50">
                    {preview}
                </div>
            )}

            {/* ── Expandable content ── */}
            {open && (
                <div className={`border-t border-gray-100 dark:border-neutral-800 ${bare ? "" : "px-5 pb-5 pt-2"}`}>
                    {children}
                </div>
            )}
        </div>
    );
}
