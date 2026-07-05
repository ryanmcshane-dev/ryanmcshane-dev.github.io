/**
 * Adzuna adapter — a query-based job *aggregator* (not a per-company ATS board).
 * GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}?app_id=…&app_key=…&what=…
 *
 * Adzuna broadens coverage well beyond the curated ATS list, but two things differ from the ATS
 * adapters:
 *  - It needs free-tier credentials (`ADZUNA_APP_ID` / `ADZUNA_APP_KEY`). When they're absent the
 *    source is simply **disabled** — the pipeline still runs on the free, no-secrets path.
 *  - It searches by keyword, so it returns roles from *any* company (reputability isn't guaranteed
 *    up front the way the curated ATS list is). The pre-filter's gates and Tier-2's judgment carry
 *    more of the weight here.
 */
import type {
  FetchLike,
  Posting,
  RawAdzunaJob,
  RawAdzunaResponse,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

/** Default keyword searches — kept small to respect the free tier (one API call each). */
export const ADZUNA_QUERIES = [
  'senior software engineer',
  'staff software engineer',
  'backend engineer',
  'ai engineer',
];

export interface AdzunaCreds {
  appId: string;
  appKey: string;
}

/** Read Adzuna credentials from the environment; `null` (source disabled) when either is missing. */
export function getAdzunaCreds(env: NodeJS.ProcessEnv = process.env): AdzunaCreds | null {
  const appId = env.ADZUNA_APP_ID?.trim();
  const appKey = env.ADZUNA_APP_KEY?.trim();
  if (!appId || !appKey) return null;
  return { appId, appKey };
}

/** Build a search URL for one keyword query (US, recent full-time roles, newest first). */
export function adzunaUrl(country: string, page: number, query: string, creds: AdzunaCreds): string {
  const params = new URLSearchParams({
    app_id: creds.appId,
    app_key: creds.appKey,
    results_per_page: '50',
    what: query,
    max_days_old: '30',
    sort_by: 'date',
    full_time: '1',
    'content-type': 'application/json',
  });
  return `${ADZUNA_BASE}/${country}/search/${page}?${params.toString()}`;
}

/** Adzuna has no structured remote flag — infer it from the title, location, and description text. */
function remoteFromAdzuna(job: RawAdzunaJob): Remote {
  const hay = `${job.title} ${job.location?.display_name ?? ''} ${job.description ?? ''}`.toLowerCase();
  if (/\bhybrid\b/.test(hay)) return 'hybrid';
  if (/\bremote\b/.test(hay)) return true;
  return 'unknown';
}

/** Only trust salary that came from the posting (not Adzuna's own estimate). */
function compFromAdzuna(job: RawAdzunaJob): string | undefined {
  if (job.salary_is_predicted === '1') return undefined;
  const min = typeof job.salary_min === 'number' ? Math.round(job.salary_min) : undefined;
  const max = typeof job.salary_max === 'number' ? Math.round(job.salary_max) : undefined;
  const top = max ?? min;
  if (top === undefined) return undefined;
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
  return min !== undefined && max !== undefined && min !== max ? `${fmt(min)} - ${fmt(max)}` : fmt(top);
}

export function mapAdzuna(raw: RawAdzunaResponse): Posting[] {
  return (raw.results ?? []).map((job) => {
    const comp = compFromAdzuna(job);
    return {
      id: stableId('adzuna', job.id),
      source: 'adzuna',
      company: job.company?.display_name?.trim() || 'Unknown',
      title: job.title.trim(),
      location: job.location?.display_name?.trim() || 'Unspecified',
      remote: remoteFromAdzuna(job),
      url: job.redirect_url,
      descriptionText: capText(htmlToText(job.description ?? ''), DESCRIPTION_CAP),
      ...(job.created ? { postedAt: job.created } : {}),
      ...(comp ? { compHint: comp } : {}),
    };
  });
}

export interface AdzunaResult {
  postings: Posting[];
  /** One message per query that failed — Adzuna's free tier returns transient 429/503s. */
  errors: string[];
}

/**
 * Run each configured query, **isolating failures per query** so a single transient error (429/503)
 * doesn't discard the results from the other queries. Returns the merged postings plus any
 * per-query error messages for the caller to surface.
 */
export async function fetchAdzuna(
  creds: AdzunaCreds,
  queries: string[] = ADZUNA_QUERIES,
  fetchImpl: FetchLike = fetch,
): Promise<AdzunaResult> {
  const postings: Posting[] = [];
  const errors: string[] = [];
  for (const query of queries) {
    try {
      const res = await fetchImpl(adzunaUrl('us', 1, query, creds));
      if (!res.ok) throw new Error(`Adzuna "${query}" → HTTP ${res.status}`);
      postings.push(...mapAdzuna((await res.json()) as RawAdzunaResponse));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { postings, errors };
}
