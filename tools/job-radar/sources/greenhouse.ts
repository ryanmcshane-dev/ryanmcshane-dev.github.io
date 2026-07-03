/**
 * Greenhouse Job Board API adapter.
 * GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 * Returns `{ jobs: [...] }`; description `content` arrives HTML-entity-encoded.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawGreenhouseJob,
  RawGreenhouseResponse,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const BASE = 'https://boards-api.greenhouse.io/v1/boards';

export function greenhouseUrl(token: string): string {
  return `${BASE}/${encodeURIComponent(token)}/jobs?content=true`;
}

/** Greenhouse exposes remote-ness via a "Workplace Type" metadata field and/or the location. */
function remoteFromGreenhouse(job: RawGreenhouseJob): Remote {
  const workplace = job.metadata?.find((m) => m.name.toLowerCase() === 'workplace type')?.value;
  if (typeof workplace === 'string') {
    const v = workplace.toLowerCase();
    if (v.includes('remote')) return true;
    if (v.includes('hybrid')) return 'hybrid'; // office-anchored but partly remote — scored as a lesser fit
    if (v.includes('on-site') || v.includes('onsite') || v.includes('in-office')) return false;
  }
  const loc = job.location?.name?.toLowerCase() ?? '';
  if (loc.includes('remote')) return true;
  return 'unknown';
}

function compFromGreenhouse(job: RawGreenhouseJob): string | undefined {
  const hit = job.metadata?.find(
    (m) => /salary|pay range|compensation/i.test(m.name) && typeof m.value === 'string',
  );
  return typeof hit?.value === 'string' ? hit.value : undefined;
}

export function mapGreenhouse(raw: RawGreenhouseResponse, company: string): Posting[] {
  return (raw.jobs ?? []).map((job) => {
    const location = job.location?.name?.trim() || job.offices?.[0]?.name?.trim() || 'Unspecified';
    const comp = compFromGreenhouse(job);
    return {
      id: stableId('greenhouse', job.id),
      source: 'greenhouse',
      company,
      title: job.title.trim(),
      location,
      remote: remoteFromGreenhouse(job),
      url: job.absolute_url,
      descriptionText: capText(htmlToText(job.content ?? ''), DESCRIPTION_CAP),
      ...(job.updated_at ? { postedAt: job.updated_at } : {}),
      ...(comp ? { compHint: comp } : {}),
    };
  });
}

export async function fetchGreenhouse(
  company: CompanyConfig,
  fetchImpl: FetchLike = fetch,
): Promise<Posting[]> {
  const res = await fetchImpl(greenhouseUrl(company.token));
  if (!res.ok) throw new Error(`Greenhouse "${company.token}" → HTTP ${res.status}`);
  const raw = (await res.json()) as RawGreenhouseResponse;
  return mapGreenhouse(raw, company.name);
}
