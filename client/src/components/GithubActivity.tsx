import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GithubActivityData {
  username: string;
  total: number;
  days: ContributionDay[];
}

// GitHub's own greens, with a neutral empty cell that suits the page colour
const LEVELS = [
  "bg-black/[0.06] dark:bg-white/[0.07]",
  "bg-[#9be9a8] dark:bg-[#0e4429]",
  "bg-[#40c463] dark:bg-[#006d32]",
  "bg-[#30a14e] dark:bg-[#26a641]",
  "bg-[#216e39] dark:bg-[#39d353]",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const longDate = (iso: string) =>
  parseDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Split the days into week columns that start on Sunday, as GitHub does. */
function toWeeks(days: ContributionDay[]): (ContributionDay | null)[][] {
  const weeks: (ContributionDay | null)[][] = [];
  let week: (ContributionDay | null)[] = [];
  days.forEach((day, i) => {
    const weekday = parseDate(day.date).getUTCDay();
    if (i === 0) week = Array(weekday).fill(null);
    else if (weekday === 0) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  });
  if (week.length) weeks.push(week);
  return weeks;
}

export default function GithubActivity() {
  const { data, isLoading } = useQuery<GithubActivityData>({ queryKey: ["/api/github/activity"], retry: false });
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens the graph scrolls sideways; start at the most recent weeks.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [data]);

  if (isLoading) {
    return <div className="h-[150px] animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.04]" aria-hidden="true" />;
  }
  // If GitHub can't be reached the projects below still stand on their own.
  if (!data) return null;

  const weeks = toWeeks(data.days);
  return (
    <div data-testid="github-activity">
      {/* Contribution graph */}
      <div ref={scroller} className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-block min-w-full">
          <div className="flex gap-[3px] text-[10px] leading-none text-gray-500 dark:text-neutral-500" aria-hidden="true">
            {weeks.map((week, i) => {
              const first = week.find(Boolean);
              const prev = i > 0 ? weeks[i - 1].find(Boolean) : null;
              const month = first ? parseDate(first.date).getUTCMonth() : -1;
              const starts = first && (!prev || parseDate(prev.date).getUTCMonth() !== month);
              return (
                <span key={i} className="h-3 w-[10px] shrink-0 overflow-visible whitespace-nowrap">
                  {starts && i < weeks.length - 1 ? MONTHS[month] : ""}
                </span>
              );
            })}
          </div>
          <div
            className="mt-1.5 flex gap-[3px]"
            role="img"
            aria-label={`GitHub contribution graph: ${data.total.toLocaleString("en-GB")} contributions in the last year`}
          >
            {weeks.map((week, i) => (
              <div key={i} className="flex shrink-0 flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, row) => {
                  const day = week[row];
                  return day ? (
                    <span
                      key={row}
                      title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${longDate(day.date)}`}
                      className={`size-[10px] rounded-[2.5px] ${LEVELS[day.level] ?? LEVELS[0]}`}
                    />
                  ) : (
                    <span key={row} className="size-[10px]" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
