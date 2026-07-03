/**
 * Source fan-out: run every configured company's adapter, isolate per-company failures, merge
 * and dedupe the results. One bad board never fails the whole run — its error is collected and
 * the rest proceed.
 */
import type { AtsSource, CompanyConfig, FetchLike, Posting } from '../types';
import { normalizeKey, normalizeUrl } from '../util';
import { fetchGreenhouse } from './greenhouse';
import { fetchLever } from './lever';
import { fetchAshby } from './ashby';

export interface SourceError {
  company: string;
  ats: AtsSource;
  message: string;
}

export interface SourceRunResult {
  postings: Posting[];
  errors: SourceError[];
}

type Fetcher = (company: CompanyConfig, fetchImpl?: FetchLike) => Promise<Posting[]>;

const FETCHERS: Record<AtsSource, Fetcher> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
};

/** Fetch + normalize every company's board, isolating failures, then dedupe the merged set. */
export async function collectPostings(
  companies: CompanyConfig[],
  fetchImpl?: FetchLike,
): Promise<SourceRunResult> {
  const errors: SourceError[] = [];
  const perCompany = await Promise.all(
    companies.map(async (company) => {
      try {
        return await FETCHERS[company.ats](company, fetchImpl);
      } catch (err) {
        errors.push({
          company: company.name,
          ats: company.ats,
          message: err instanceof Error ? err.message : String(err),
        });
        return [] as Posting[];
      }
    }),
  );
  return { postings: dedupe(perCompany.flat()), errors };
}

/** Sortable freshness: parsed `postedAt`, or 0 when absent/unparseable. */
function freshness(posting: Posting): number {
  const t = posting.postedAt ? Date.parse(posting.postedAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** A posting is a duplicate if it shares a normalized URL or a (company, title) with another. */
function dedupeKeys(posting: Posting): string[] {
  return [
    `url:${normalizeUrl(posting.url)}`,
    `ct:${normalizeKey(posting.company)}::${normalizeKey(posting.title)}`,
  ];
}

/**
 * Collapse duplicates, keeping the freshest of each cluster. Dedupe is by URL *or* by
 * (company, title), so the same role surfaced twice (e.g. two boards, or an apply vs. hosted
 * URL) merges to one entry.
 */
export function dedupe(postings: Posting[]): Posting[] {
  const survivors = new Map<string, Posting>(); // canonical id → winning posting
  const keyToId = new Map<string, string>(); // any dedupe key → canonical id

  for (const posting of postings) {
    const keys = dedupeKeys(posting);
    const existingId = keys.map((k) => keyToId.get(k)).find((id): id is string => Boolean(id));
    if (existingId) {
      const current = survivors.get(existingId)!;
      const winner = freshness(posting) > freshness(current) ? posting : current;
      survivors.set(existingId, winner);
      for (const k of keys) keyToId.set(k, existingId);
    } else {
      survivors.set(posting.id, posting);
      for (const k of keys) keyToId.set(k, posting.id);
    }
  }

  return [...survivors.values()];
}
