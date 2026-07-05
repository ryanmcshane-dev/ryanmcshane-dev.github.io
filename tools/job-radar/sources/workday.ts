/**
 * Workday CXS adapter — reaches companies that recruit on Workday-hosted career sites
 * ({tenant}.{dc}.myworkdayjobs.com), used here for the HCM / group-benefits domain-overlap tier
 * (e.g. Workday, Unum). Tenant/datacenter/site are discovered per company and carried in
 * `CompanyConfig.workday`.
 *
 * Two-step and POST-based, unlike the other adapters:
 *  1. POST …/wday/cxs/{tenant}/{site}/jobs (a JSON body with `searchText`) returns a *summary* list.
 *     The summary's `locationsText` is often an opaque aggregate ("2 Locations"), so it can't be
 *     US-gated on its own.
 *  2. GET …/{site}{externalPath} returns the detail: real country, remote type, description, ISO
 *     date, and canonical URL. The adapter enriches each summary with one detail call, isolating
 *     per-posting failures (a failed/description-less detail is skipped rather than admitted with an
 *     unusable location), and caps detail calls so a large board can't balloon a run.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawWorkdayDetail,
  RawWorkdayListItem,
  RawWorkdayListResponse,
  Remote,
  WorkdayTenant,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

/** Keyword narrowing for the list POST — keeps the board to engineering roles (and the run small). */
export const WORKDAY_QUERIES = ['software engineer', 'backend engineer'];

/** Postings requested per query (CXS caps a page at 20) and total detail calls per company. */
export const WORKDAY_PAGE_LIMIT = 20;
export const WORKDAY_MAX_DETAILS = 60;

export interface WorkdayOptions {
  queries?: string[];
  maxDetails?: number;
  pageLimit?: number;
}

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

function cxsBase(w: WorkdayTenant): string {
  return `https://${w.tenant}.${w.dc}.myworkdayjobs.com/wday/cxs/${w.tenant}/${w.site}`;
}

export function workdayListUrl(w: WorkdayTenant): string {
  return `${cxsBase(w)}/jobs`;
}

/** `externalPath` already begins with "/job/…", so it's appended to the CXS site base verbatim. */
export function workdayDetailUrl(w: WorkdayTenant, externalPath: string): string {
  return `${cxsBase(w)}${externalPath}`;
}

/** Map Workday's `remoteType` string to our `Remote`. Absent ⇒ 'unknown' (flagged, never dropped). */
function remoteFromWorkday(remoteType: string | undefined): Remote {
  const t = (remoteType ?? '').toLowerCase();
  if (t.includes('remote')) return true;
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('on-site') || t.includes('onsite') || t.includes('in office') || t.includes('office')) {
    return false;
  }
  return 'unknown';
}

/** Join the posting's location with its country so the downstream US gate can read the geography. */
function locationFromWorkday(location: string | undefined, country: string | undefined): string {
  const parts = [location?.trim(), country?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : 'Unspecified';
}

export function mapWorkdayDetail(detail: RawWorkdayDetail, company: string, w: WorkdayTenant): Posting {
  const info = detail.jobPostingInfo ?? {};
  const url = info.externalUrl || `https://${w.tenant}.${w.dc}.myworkdayjobs.com/${w.site}`;
  return {
    id: stableId('workday', w.tenant, info.jobReqId ?? info.id ?? info.title ?? url),
    source: 'workday',
    company,
    title: (info.title ?? '').trim(),
    location: locationFromWorkday(info.location, info.country?.descriptor),
    remote: remoteFromWorkday(info.remoteType),
    url,
    descriptionText: capText(htmlToText(info.jobDescription ?? ''), DESCRIPTION_CAP),
    ...(info.startDate ? { postedAt: info.startDate } : {}),
  };
}

export async function fetchWorkday(
  company: CompanyConfig,
  fetchImpl: FetchLike = fetch,
  options: WorkdayOptions = {},
): Promise<Posting[]> {
  const w = company.workday;
  if (!w) throw new Error(`Workday company "${company.name}" is missing its tenant config`);

  const queries = options.queries ?? WORKDAY_QUERIES;
  const maxDetails = options.maxDetails ?? WORKDAY_MAX_DETAILS;
  const pageLimit = options.pageLimit ?? WORKDAY_PAGE_LIMIT;

  // 1. Enumerate unique postings across the keyword queries (dedupe by externalPath).
  const byPath = new Map<string, RawWorkdayListItem>();
  for (const query of queries) {
    const res = await fetchImpl(workdayListUrl(w), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ appliedFacets: {}, limit: pageLimit, offset: 0, searchText: query }),
    });
    if (!res.ok) throw new Error(`Workday "${w.tenant}" list (${query}) → HTTP ${res.status}`);
    const body = (await res.json()) as RawWorkdayListResponse;
    for (const item of body.jobPostings ?? []) if (item?.externalPath) byPath.set(item.externalPath, item);
  }

  // 2. Enrich each with a detail call for country/remote/description/date, isolating failures.
  //    A failed detail is skipped: without it the location is an unusable aggregate ("2 Locations").
  const items = [...byPath.values()].slice(0, maxDetails);
  const postings: Posting[] = [];
  for (const item of items) {
    try {
      const res = await fetchImpl(workdayDetailUrl(w, item.externalPath), { headers: JSON_HEADERS });
      if (!res.ok) throw new Error(`detail ${item.externalPath} → HTTP ${res.status}`);
      postings.push(mapWorkdayDetail((await res.json()) as RawWorkdayDetail, company.name, w));
    } catch {
      // skip — never admit a posting we can't geo-locate
    }
  }
  return postings;
}
