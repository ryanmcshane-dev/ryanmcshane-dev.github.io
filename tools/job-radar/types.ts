/**
 * Job Radar — shared types.
 *
 * Two layers live here:
 *  1. The normalized domain model (`Posting`, `FitScore`, `ScoredPosting`) that the whole
 *     pipeline speaks — see SPEC.md §4.
 *  2. The raw wire shapes returned by each public ATS board API (`Raw*`). Adapters map raw →
 *     `Posting`; fixtures are typed against these so a payload-shape drift is a compile error.
 *
 * Every field the adapters read is declared; fields the ATSes return but we ignore are omitted
 * to keep the surface honest.
 */

/** The public ATS board sources supported in v1. */
export type AtsSource = 'greenhouse' | 'lever' | 'ashby';

/**
 * Remote-eligibility of a posting:
 *  - `true`  — clearly remote-eligible
 *  - `false` — clearly on-site only
 *  - `'hybrid'` — office-anchored but partly remote; kept, but scored as a lesser fit
 *  - `'unknown'` — the source gives no clear signal
 */
export type Remote = boolean | 'hybrid' | 'unknown';

/** A normalized job posting — the common shape every adapter produces. */
export interface Posting {
  /** Stable id: hash of `source` + the source's external id. */
  id: string;
  source: AtsSource;
  company: string;
  title: string;
  location: string;
  remote: Remote;
  url: string;
  /** Plain text, HTML stripped and length-capped. */
  descriptionText: string;
  /** ISO 8601 when the source exposes a post/update date. */
  postedAt?: string;
  /** Free-text comp signal when the ATS exposes one (Ashby often does). */
  compHint?: string;
}

export type Verdict = 'strong' | 'possible' | 'weak' | 'skip';

/** The fit judgment attached to a posting (Tier-1 deterministic or Tier-2 Claude Code). */
export interface FitScore {
  /** 0–100. */
  fit: number;
  verdict: Verdict;
  /** One short paragraph, grounded in the posting + fit spec. */
  rationale: string;
  /** Which must-haves / nice-to-haves the posting hit. */
  matched: string[];
  /** Gaps or dealbreaker-adjacent flags. */
  concerns: string[];
}

export interface ScoredPosting extends Posting {
  score: FitScore;
}

/** One entry in the curated target list (`companies.ts`). */
export interface CompanyConfig {
  /** Display name, e.g. "Airbnb". */
  name: string;
  ats: AtsSource;
  /** Board slug/token, e.g. "airbnb" for boards-api.greenhouse.io/v1/boards/airbnb. */
  token: string;
}

/** Minimal structural subset of the fetch `Response` the adapters use. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

/**
 * Injectable fetch. Global `fetch` satisfies it; tests pass a stub returning fixture JSON, so no
 * adapter ever hits the network in a unit test.
 */
export type FetchLike = (url: string) => Promise<FetchResponseLike>;

/* ------------------------------------------------------------------ *
 * Raw wire shapes — the subset of each ATS payload the adapters read. *
 * ------------------------------------------------------------------ */

/** Greenhouse: GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true */
export interface RawGreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location: { name: string } | null;
  /** HTML, entity-encoded (e.g. `&lt;p&gt;`). Present only with `?content=true`. */
  content?: string;
  metadata?: Array<{ name: string; value: string | boolean | null; value_type: string }> | null;
  offices?: Array<{ name: string }> | null;
  departments?: Array<{ name: string }> | null;
}
export interface RawGreenhouseResponse {
  jobs: RawGreenhouseJob[];
}

/** Lever: GET api.lever.co/v0/postings/{token}?mode=json — returns a bare array. */
export interface RawLeverPosting {
  id: string;
  /** The posting title. */
  text: string;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  } | null;
  /** 'remote' | 'on-site' | 'hybrid' | 'unspecified' (Lever's vocabulary). */
  workplaceType?: string;
  country?: string;
  hostedUrl: string;
  applyUrl?: string;
  /** Milliseconds since epoch. */
  createdAt?: number;
  descriptionPlain?: string;
  /** HTML. */
  description?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
}
export type RawLeverResponse = RawLeverPosting[];

/** Ashby: GET api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true */
export interface RawAshbyCompensation {
  compensationTierSummary?: string | null;
  scrapeableCompensationSalarySummary?: string | null;
  summaryComponents?: Array<{
    compensationType?: string;
    minValue?: number | null;
    maxValue?: number | null;
    currencyCode?: string;
    interval?: string;
  }> | null;
}
export interface RawAshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: Array<{ location: string }> | null;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl: string;
  applyUrl?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  compensation?: RawAshbyCompensation | null;
}
export interface RawAshbyResponse {
  jobs: RawAshbyJob[];
  apiVersion?: string;
}
