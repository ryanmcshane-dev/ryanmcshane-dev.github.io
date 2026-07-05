/**
 * SmartRecruiters adapter — a per-company board (like Greenhouse/Lever/Ashby), used here for
 * companies that recruit on SmartRecruiters (e.g. ServiceNow).
 *
 * Two-step, unlike the other ATS adapters:
 *  1. GET …/companies/{id}/postings?country=us&q=… returns *summaries only* (title, structured
 *     location, date) — no description.
 *  2. GET …/companies/{id}/postings/{postingId} returns the full detail (description + canonical
 *     apply URL). The adapter enriches each summary with one detail call, **isolating per-posting
 *     failures** (a failed detail falls back to the description-less summary rather than dropping the
 *     role), and caps the number of detail calls so a large board can't balloon a run.
 *
 * SmartRecruiters company identifiers are **case-sensitive** (e.g. `ServiceNow`), so `token` is used
 * verbatim.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawSmartRecruitersDetail,
  RawSmartRecruitersListResponse,
  RawSmartRecruitersLocation,
  RawSmartRecruitersPosting,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const BASE = 'https://api.smartrecruiters.com/v1/companies';

/** Keyword narrowing for the list call — keeps the board to engineering roles (and the run small). */
export const SMARTRECRUITERS_QUERIES = ['engineer', 'developer'];

/** Cap on per-posting detail calls per company, so a large board doesn't balloon a run. */
export const SMARTRECRUITERS_MAX_DETAILS = 100;

export interface SmartRecruitersOptions {
  queries?: string[];
  maxDetails?: number;
}

export function smartRecruitersListUrl(token: string, query: string, limit = 100, offset = 0): string {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    country: 'us', // US-only up front (Ryan's geography gate); the API filters server-side
    q: query,
  });
  return `${BASE}/${encodeURIComponent(token)}/postings?${params.toString()}`;
}

export function smartRecruitersDetailUrl(token: string, postingId: string): string {
  return `${BASE}/${encodeURIComponent(token)}/postings/${encodeURIComponent(postingId)}`;
}

/** Remote-ness from SmartRecruiters' structured location booleans (no text-guessing needed). */
function remoteFromSR(loc: RawSmartRecruitersLocation | null | undefined): Remote {
  if (loc?.remote) return true;
  if (loc?.hybrid) return 'hybrid';
  return 'unknown';
}

function locationFromSR(loc: RawSmartRecruitersLocation | null | undefined): string {
  if (loc?.fullLocation?.trim()) return loc.fullLocation.trim();
  const parts = [loc?.city, loc?.region, loc?.country?.toUpperCase()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unspecified';
}

function descFromSR(detail: RawSmartRecruitersDetail): string {
  const s = detail.jobAd?.sections ?? {};
  const html = [s.jobDescription?.text, s.qualifications?.text].filter(Boolean).join('\n');
  return capText(htmlToText(html), DESCRIPTION_CAP);
}

function publicUrl(identifier: string | undefined, id: string): string {
  return `https://jobs.smartrecruiters.com/${identifier ?? ''}/${id}`;
}

/** Map a full detail record (with description + canonical apply URL) to a `Posting`. */
export function mapSmartRecruitersDetail(detail: RawSmartRecruitersDetail, company: string): Posting {
  const url = detail.applyUrl || detail.postingUrl || publicUrl(detail.company?.identifier, detail.id);
  return {
    id: stableId('smartrecruiters', detail.id),
    source: 'smartrecruiters',
    company,
    title: detail.name.trim(),
    location: locationFromSR(detail.location),
    remote: remoteFromSR(detail.location),
    url,
    descriptionText: descFromSR(detail),
    ...(detail.releasedDate ? { postedAt: detail.releasedDate } : {}),
  };
}

/** Fallback map from a summary alone (used when a detail call fails) — no description, guessed URL. */
export function mapSmartRecruitersSummary(summary: RawSmartRecruitersPosting, company: string): Posting {
  return {
    id: stableId('smartrecruiters', summary.id),
    source: 'smartrecruiters',
    company,
    title: summary.name.trim(),
    location: locationFromSR(summary.location),
    remote: remoteFromSR(summary.location),
    url: publicUrl(summary.company?.identifier, summary.id),
    descriptionText: '',
    ...(summary.releasedDate ? { postedAt: summary.releasedDate } : {}),
  };
}

export async function fetchSmartRecruiters(
  company: CompanyConfig,
  fetchImpl: FetchLike = fetch,
  options: SmartRecruitersOptions = {},
): Promise<Posting[]> {
  const queries = options.queries ?? SMARTRECRUITERS_QUERIES;
  const maxDetails = options.maxDetails ?? SMARTRECRUITERS_MAX_DETAILS;

  // 1. Collect unique summaries across the keyword queries (a role can hit more than one).
  const byId = new Map<string, RawSmartRecruitersPosting>();
  for (const query of queries) {
    const res = await fetchImpl(smartRecruitersListUrl(company.token, query));
    if (!res.ok) throw new Error(`SmartRecruiters "${company.token}" list (${query}) → HTTP ${res.status}`);
    const body = (await res.json()) as RawSmartRecruitersListResponse;
    for (const posting of body.content ?? []) if (posting?.id) byId.set(posting.id, posting);
  }

  // 2. Enrich each summary with a detail call for the description + canonical URL, isolating
  //    per-posting failures (fall back to the summary rather than dropping the role).
  const summaries = [...byId.values()].slice(0, maxDetails);
  const postings: Posting[] = [];
  for (const summary of summaries) {
    try {
      const res = await fetchImpl(smartRecruitersDetailUrl(company.token, summary.id));
      if (!res.ok) throw new Error(`detail ${summary.id} → HTTP ${res.status}`);
      postings.push(mapSmartRecruitersDetail((await res.json()) as RawSmartRecruitersDetail, company.name));
    } catch {
      postings.push(mapSmartRecruitersSummary(summary, company.name));
    }
  }
  return postings;
}
