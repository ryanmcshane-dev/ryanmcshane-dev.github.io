/**
 * Pipeline orchestration (SPEC.md §5 stages 4 & 6).
 *
 * Wires the stages into two committed JSON artifacts, with **no paid API anywhere**:
 *   fetch+dedupe (sources) → pre-filter → Tier-1 score → rank → write.
 *
 * Two files come out of a run:
 *  - `latest.json`     — the page-facing ranked shortlist the site renders.
 *  - `candidates.json` — the Tier-2 working set: the same survivors with fuller descriptions plus a
 *                        transparency list of what was dropped and why, for the on-command
 *                        `/radar-score` Claude Code pass to read and re-score.
 *
 * The assembly core (`assembleReports`) is pure — `SourceRunResult` + a clock in, reports out — so
 * it unit-tests deterministically without a network or a filesystem. `runPipeline` adds the fetch;
 * `writeRadarFiles` adds the disk write (both injectable).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fitSpec, type FitSpec } from './fitSpec';
import { companies as defaultCompanies } from './companies';
import { prefilter, type DropReason } from './prefilter';
import { scorePostings } from './scoreRules';
import { collectPostings, type SourceError, type SourceRunResult } from './sources';
import type { CompanyConfig, FetchLike, ScoredPosting, Verdict } from './types';
import { capText } from './util';

/** Which scoring tier produced a file's scores. */
export type ScoreTier = 'tier-1' | 'tier-2';

export interface RadarCounts {
  /** Postings fetched and deduped (the pre-filter's input). */
  fetched: number;
  /** Survived the pre-filter. */
  kept: number;
  /** Dropped by the pre-filter. */
  dropped: number;
  /** Survivors bucketed by verdict. */
  byVerdict: Record<Verdict, number>;
  /** Drops bucketed by hard-gate reason (transparency without enumerating every drop). */
  droppedByReason: Record<DropReason, number>;
}

/** The page-facing artifact (`latest.json`). */
export interface RadarReport {
  generatedAt: string;
  tier: ScoreTier;
  counts: RadarCounts;
  /** Per-company fetch failures — surfaced, never fatal. */
  errors: SourceError[];
  /** Ranked survivors (best fit first). */
  items: ScoredPosting[];
}

/** One dropped posting, summarized for the transparency list in `candidates.json`. */
export interface DroppedSummary {
  company: string;
  title: string;
  url: string;
  reason: DropReason;
  detail: string;
}

/** The Tier-2 working set (`candidates.json`). */
export interface CandidatesFile {
  generatedAt: string;
  tier: 'tier-1';
  counts: RadarCounts;
  errors: SourceError[];
  candidates: ScoredPosting[];
  /** A small, capped sample of drops for spot-checking — full totals live in `counts`. */
  droppedSample: DroppedSummary[];
}

/** Description caps per artifact: shorter for the page, fuller for the Tier-2 read. */
const PAGE_DESC_CAP = 600;
const TIER2_DESC_CAP = 1500;

/**
 * How many ranked survivors land in the artifacts (SPEC.md §5 stage 6, "top N"). Keeps the page a
 * human-sized shortlist and the Tier-2 Claude batch tractable; `counts` still reflect the full set.
 */
export const DEFAULT_TOP_N = 50;

/** How many example drops to keep in `candidates.json` (the rest are summarized in `counts`). */
const DROPPED_SAMPLE = 12;

/** Default on-disk locations, resolved from the repo root (matches `npm run radar`'s cwd). */
export const DATA_DIR = resolve(process.cwd(), 'data/job-radar');
export const LATEST_PATH = resolve(DATA_DIR, 'latest.json');
export const CANDIDATES_PATH = resolve(DATA_DIR, 'candidates.json');

/** Sortable freshness: parsed `postedAt`, or 0 when absent/unparseable. */
function freshness(posting: ScoredPosting): number {
  const t = posting.postedAt ? Date.parse(posting.postedAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Rank by fit desc, then freshness desc, then title asc — deterministic and stable. */
export function rankScored(items: ScoredPosting[]): ScoredPosting[] {
  return [...items].sort(
    (a, b) =>
      b.score.fit - a.score.fit || freshness(b) - freshness(a) || a.title.localeCompare(b.title),
  );
}

function countByVerdict(items: ScoredPosting[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { strong: 0, possible: 0, weak: 0, skip: 0 };
  for (const item of items) counts[item.score.verdict] += 1;
  return counts;
}

function countByReason(dropped: Array<{ reason: DropReason }>): Record<DropReason, number> {
  const counts: Record<DropReason, number> = {
    'excluded-title': 0,
    'off-role-family': 0,
    'on-site-only': 0,
    'below-comp-floor': 0,
  };
  for (const d of dropped) counts[d.reason] += 1;
  return counts;
}

/** A copy of a scored posting with its description capped for the target artifact. */
function trimItem(posting: ScoredPosting, cap: number): ScoredPosting {
  return { ...posting, descriptionText: capText(posting.descriptionText, cap) };
}

/**
 * Pure assembly: pre-filter → Tier-1 score → rank → build both report artifacts. Deterministic
 * given a fixed `now` and source set.
 */
export function assembleReports(
  source: SourceRunResult,
  opts: { now: Date; spec?: FitSpec; topN?: number },
): { report: RadarReport; candidates: CandidatesFile } {
  const spec = opts.spec ?? fitSpec;
  const topN = opts.topN ?? DEFAULT_TOP_N;
  const generatedAt = opts.now.toISOString();

  const { kept, dropped } = prefilter(source.postings, spec);
  const ranked = rankScored(scorePostings(kept, spec));
  const top = ranked.slice(0, topN);

  // Counts describe the *full* survivor set for transparency; the artifacts carry the top N.
  const counts: RadarCounts = {
    fetched: source.postings.length,
    kept: kept.length,
    dropped: dropped.length,
    byVerdict: countByVerdict(ranked),
    droppedByReason: countByReason(dropped),
  };

  const report: RadarReport = {
    generatedAt,
    tier: 'tier-1',
    counts,
    errors: source.errors,
    items: top.map((item) => trimItem(item, PAGE_DESC_CAP)),
  };

  const candidates: CandidatesFile = {
    generatedAt,
    tier: 'tier-1',
    counts,
    errors: source.errors,
    candidates: top.map((item) => trimItem(item, TIER2_DESC_CAP)),
    droppedSample: dropped.slice(0, DROPPED_SAMPLE).map((d) => ({
      company: d.posting.company,
      title: d.posting.title,
      url: d.posting.url,
      reason: d.reason,
      detail: d.detail,
    })),
  };

  return { report, candidates };
}

export interface PipelineOptions {
  fetchImpl?: FetchLike;
  /** Injectable clock for a deterministic `generatedAt` (tests). */
  now?: () => Date;
  spec?: FitSpec;
  /** Cap on ranked survivors written to the artifacts (default `DEFAULT_TOP_N`). */
  topN?: number;
}

/** Fetch every company's board, then assemble the reports. The one async entry point. */
export async function runPipeline(
  companies: CompanyConfig[] = defaultCompanies,
  opts: PipelineOptions = {},
): Promise<{ report: RadarReport; candidates: CandidatesFile }> {
  const source = await collectPostings(companies, opts.fetchImpl);
  return assembleReports(source, { now: opts.now?.() ?? new Date(), spec: opts.spec, topN: opts.topN });
}

/** Minimal filesystem surface, injectable so writes unit-test without touching disk. */
export interface RadarWriter {
  mkdir(dir: string): void;
  writeFile(path: string, contents: string): void;
}

const nodeWriter: RadarWriter = {
  mkdir: (dir) => void mkdirSync(dir, { recursive: true }),
  writeFile: (path, contents) => writeFileSync(path, contents, 'utf8'),
};

/** Write both artifacts as pretty JSON (trailing newline for clean diffs). */
export function writeRadarFiles(
  report: RadarReport,
  candidates: CandidatesFile,
  writer: RadarWriter = nodeWriter,
  dir: string = DATA_DIR,
): void {
  writer.mkdir(dir);
  writer.writeFile(resolve(dir, 'candidates.json'), `${JSON.stringify(candidates, null, 2)}\n`);
  writer.writeFile(resolve(dir, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`);
}
