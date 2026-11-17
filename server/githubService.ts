// Public GitHub activity for the portfolio: the contribution calendar.
// Reads the same public page github.com shows on a profile, so it needs no token.

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: number; // 0-4, GitHub's own shading level
}

export interface GithubActivity {
  username: string;
  total: number;
  days: ContributionDay[];
  fetchedAt: string;
}

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: GithubActivity }>();

function parseCalendar(html: string): { days: ContributionDay[]; total: number | null } {
  // Tooltips carry the exact count: "5 contributions on November 16th."
  const counts = new Map<string, number>();
  const tooltip = /<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  let t: RegExpExecArray | null;
  while ((t = tooltip.exec(html)) !== null) {
    const n = t[2].trim().match(/^([\d,]+)\s+contribution/);
    counts.set(t[1], n ? parseInt(n[1].replace(/,/g, ""), 10) : 0);
  }

  const days: ContributionDay[] = [];
  const cell = /<td[^>]*class="ContributionCalendar-day"[^>]*>/g;
  let c: RegExpExecArray | null;
  while ((c = cell.exec(html)) !== null) {
    const date = c[0].match(/data-date="([^"]+)"/)?.[1];
    const level = c[0].match(/data-level="(\d)"/)?.[1];
    const id = c[0].match(/\sid="([^"]+)"/)?.[1];
    if (!date) continue;
    days.push({ date, level: level ? parseInt(level, 10) : 0, count: (id && counts.get(id)) || 0 });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  return { days, total: totalMatch ? parseInt(totalMatch[1].replace(/,/g, ""), 10) : null };
}

export async function getGithubActivity(username: string): Promise<GithubActivity> {
  const hit = cache.get(username);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  try {
    const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
      headers: { "X-Requested-With": "XMLHttpRequest", "User-Agent": "portfolio-site" },
    });
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
    const { days, total } = parseCalendar(await res.text());
    if (days.length === 0) throw new Error("No contribution days found in GitHub's response");

    const data: GithubActivity = {
      username,
      total: total ?? days.reduce((sum, d) => sum + d.count, 0),
      days,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(username, { at: Date.now(), data });
    return data;
  } catch (error) {
    // GitHub being unreachable should not blank the section if we have older data.
    if (hit) return hit.data;
    throw error;
  }
}
