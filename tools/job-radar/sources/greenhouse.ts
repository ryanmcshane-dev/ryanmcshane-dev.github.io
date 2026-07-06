/**
 * Greenhouse Job Board API adapter.
 * GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 * Returns `{ jobs: [...] }`; description `content` arrives HTML-entity-encoded.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawGreenhouseCurrencyRange,
  RawGreenhouseJob,
  RawGreenhouseResponse,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const BASE = 'https://boards-api.greenhouse.io/v1/boards';

export function greenhouseUrl(token: string): string {
  return `${BASE}/${encodeURIComponent(token)}/jobs?content=true`;
}

/**
 * Greenhouse exposes remote-ness via metadata the company configures itself, so the field name and
 * shape vary per board: a "Workplace Type" single-select string (Remote/Hybrid/On-site), a yes/no
 * boolean field whose *name* says "remote" (e.g. Block's "Position open to remote"), or — lacking
 * either — the location text.
 */
function remoteFromGreenhouse(job: RawGreenhouseJob): Remote {
  const workplace = job.metadata?.find((m) => m.name.toLowerCase() === 'workplace type')?.value;
  if (typeof workplace === 'string') {
    const v = workplace.toLowerCase();
    if (v.includes('remote')) return true;
    if (v.includes('hybrid')) return 'hybrid'; // office-anchored but partly remote — scored as a lesser fit
    if (v.includes('on-site') || v.includes('onsite') || v.includes('in-office')) return false;
  }

  const remoteFlag = job.metadata?.find((m) => /\bremote\b/i.test(m.name))?.value;
  if (typeof remoteFlag === 'boolean') return remoteFlag;

  const loc = job.location?.name?.toLowerCase() ?? '';
  if (loc.includes('remote')) return true;
  return 'unknown';
}

/** `min_value`/`max_value` arrive as numeric strings; render a USD range only (skip non-USD zones). */
function formatUsdRange(range: RawGreenhouseCurrencyRange): string | undefined {
  if (typeof range.unit !== 'string' || range.unit.toUpperCase() !== 'USD') return undefined;
  const min = Number(range.min_value);
  const max = Number(range.max_value);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
  return `$${min.toLocaleString('en-US')}–$${max.toLocaleString('en-US')}`;
}

/**
 * Some boards state comp as a free-text metadata string; others (e.g. Block) configure a structured
 * `currency_range` field per pay zone (Zone A/B/C/D). Collect every USD-denominated hit — the
 * pre-filter/scorer only need the highest stated figure, which `parseTopUsd` extracts.
 */
function compFromGreenhouse(job: RawGreenhouseJob): string | undefined {
  const hits = (job.metadata ?? []).filter((m) => /salary|pay range|compensation/i.test(m.name));
  const parts: string[] = [];
  for (const hit of hits) {
    if (typeof hit.value === 'string') {
      parts.push(hit.value);
    } else if (hit.value && typeof hit.value === 'object') {
      const formatted = formatUsdRange(hit.value);
      if (formatted) parts.push(formatted);
    }
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
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
