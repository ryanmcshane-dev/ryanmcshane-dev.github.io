/**
 * Job Radar page data (SPEC.md §7).
 *
 * The `/job-radar` page renders the committed pipeline output at build time. This module owns a
 * small, browser-safe *view* model and imports the JSON snapshot — deliberately decoupled from the
 * Node-only pipeline types in `tools/job-radar/*` so nothing under `tools/` (which imports
 * `node:fs`) is pulled into the app bundle.
 */
import latest from '../../data/job-radar/latest.json';

export type RadarVerdict = 'strong' | 'possible' | 'weak' | 'skip';
export type RadarRemote = boolean | 'hybrid' | 'unknown';

export interface RadarScore {
  fit: number;
  verdict: RadarVerdict;
  rationale: string;
  matched: string[];
  concerns: string[];
}

export interface RadarItem {
  id: string;
  source: string;
  company: string;
  title: string;
  location: string;
  remote: RadarRemote;
  url: string;
  descriptionText: string;
  postedAt?: string;
  compHint?: string;
  score: RadarScore;
}

export interface RadarCounts {
  fetched: number;
  kept: number;
  dropped: number;
  byVerdict: Record<RadarVerdict, number>;
  droppedByReason: Record<string, number>;
}

export interface RadarReportView {
  generatedAt: string;
  tier: 'tier-1' | 'tier-2';
  counts: RadarCounts;
  errors: Array<{ company: string; ats: string; message: string }>;
  items: RadarItem[];
}

/** The committed snapshot, cast to the view model (shape guaranteed by the pipeline + its tests). */
export const jobRadar = latest as unknown as RadarReportView;

/** Verdicts surfaced on the page, best first. `skip` is not shown. */
export const VERDICT_ORDER: RadarVerdict[] = ['strong', 'possible', 'weak'];

export const VERDICT_LABEL: Record<RadarVerdict, string> = {
  strong: 'Strong fit',
  possible: 'Possible fit',
  weak: 'Weak fit',
  skip: 'Skip',
};

/** Group the report's items by verdict, in display order, dropping empty groups. */
export function groupByVerdict(items: RadarItem[]): Array<{ verdict: RadarVerdict; items: RadarItem[] }> {
  return VERDICT_ORDER.map((verdict) => ({
    verdict,
    items: items.filter((item) => item.score.verdict === verdict),
  })).filter((group) => group.items.length > 0);
}

/** Human label for a posting's remote-eligibility. */
export function remoteLabel(remote: RadarRemote): string {
  if (remote === true) return 'Remote';
  if (remote === 'hybrid') return 'Hybrid';
  if (remote === 'unknown') return 'Remote unclear';
  return 'On-site';
}

/** Which scoring pass produced the data — surfaced honestly on the page. */
export function tierLabel(tier: RadarReportView['tier']): string {
  return tier === 'tier-2' ? 'Claude Code (Tier 2)' : 'Deterministic (Tier 1)';
}

/** Format an ISO timestamp as a readable UTC date; echoes the input if unparseable. */
export function formatRadarDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
