/**
 * Ashby Posting API adapter.
 * GET https://api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true
 * Returns `{ jobs: [...] }` with a structured `isRemote` boolean and a `compensation` block.
 * Unlisted postings (`isListed === false`) are dropped.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawAshbyJob,
  RawAshbyResponse,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const BASE = 'https://api.ashbyhq.com/posting-api/job-board';

export function ashbyUrl(token: string): string {
  return `${BASE}/${encodeURIComponent(token)}?includeCompensation=true`;
}

function remoteFromAshby(job: RawAshbyJob): Remote {
  if (typeof job.isRemote === 'boolean') {
    if (job.isRemote) return true;
    // Primary flag is on-site, but a remote secondary location still means remote-eligible.
    const secondary = (job.secondaryLocations ?? []).map((s) => s.location.toLowerCase()).join(' ');
    if (secondary.includes('remote')) return true;
    if (job.workplaceType?.toLowerCase() === 'hybrid') return 'hybrid';
    return false;
  }
  const loc = (job.location ?? '').toLowerCase();
  if (loc.includes('remote')) return true;
  return 'unknown';
}

function compFromAshby(job: RawAshbyJob): string | undefined {
  const comp = job.compensation;
  if (!comp) return undefined;
  return (
    comp.scrapeableCompensationSalarySummary?.trim() ||
    comp.compensationTierSummary?.trim() ||
    undefined
  );
}

export function mapAshby(raw: RawAshbyResponse, company: string): Posting[] {
  return (raw.jobs ?? [])
    .filter((job) => job.isListed !== false)
    .map((job) => {
      const location =
        job.location?.trim() || job.secondaryLocations?.[0]?.location?.trim() || 'Unspecified';
      const comp = compFromAshby(job);
      const text = job.descriptionPlain ?? job.descriptionHtml ?? '';
      return {
        id: stableId('ashby', job.id),
        source: 'ashby',
        company,
        title: job.title.trim(),
        location,
        remote: remoteFromAshby(job),
        url: job.jobUrl,
        descriptionText: capText(htmlToText(text), DESCRIPTION_CAP),
        ...(job.publishedAt ? { postedAt: job.publishedAt } : {}),
        ...(comp ? { compHint: comp } : {}),
      };
    });
}

export async function fetchAshby(
  company: CompanyConfig,
  fetchImpl: FetchLike = fetch,
): Promise<Posting[]> {
  const res = await fetchImpl(ashbyUrl(company.token));
  if (!res.ok) throw new Error(`Ashby "${company.token}" → HTTP ${res.status}`);
  const raw = (await res.json()) as RawAshbyResponse;
  return mapAshby(raw, company.name);
}
