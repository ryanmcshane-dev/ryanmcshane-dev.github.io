/**
 * Lever Postings API adapter.
 * GET https://api.lever.co/v0/postings/{token}?mode=json
 * Returns a bare array; `descriptionPlain` is already plain text and `createdAt` is ms epoch.
 */
import type {
  CompanyConfig,
  FetchLike,
  Posting,
  RawLeverPosting,
  RawLeverResponse,
  Remote,
} from '../types';
import { capText, htmlToText, stableId, DESCRIPTION_CAP } from '../util';

const BASE = 'https://api.lever.co/v0/postings';

export function leverUrl(token: string): string {
  return `${BASE}/${encodeURIComponent(token)}?mode=json`;
}

function remoteFromLever(posting: RawLeverPosting): Remote {
  const wt = posting.workplaceType?.toLowerCase();
  if (wt === 'remote') return true;
  if (wt === 'on-site' || wt === 'onsite') return false;
  if (wt === 'hybrid') return 'hybrid';
  const location = (posting.categories?.location ?? '').toLowerCase();
  const all = (posting.categories?.allLocations ?? []).join(' ').toLowerCase();
  if (location.includes('remote') || all.includes('remote')) return true;
  return 'unknown';
}

function compFromLever(posting: RawLeverPosting): string | undefined {
  const range = posting.salaryRange;
  if (!range || (range.min == null && range.max == null)) return undefined;
  const currency = range.currency ?? 'USD';
  const fmt = (n?: number) => (n == null ? '?' : `${currency} ${Math.round(n / 1000)}K`);
  return `${fmt(range.min)}–${fmt(range.max)}`;
}

export function mapLever(raw: RawLeverResponse, company: string): Posting[] {
  return (raw ?? []).map((posting) => {
    const location =
      posting.categories?.location?.trim() ||
      posting.categories?.allLocations?.[0]?.trim() ||
      'Unspecified';
    const comp = compFromLever(posting);
    const text = posting.descriptionPlain ?? posting.description ?? '';
    return {
      id: stableId('lever', posting.id),
      source: 'lever',
      company,
      title: posting.text.trim(),
      location,
      remote: remoteFromLever(posting),
      url: posting.hostedUrl,
      descriptionText: capText(htmlToText(text), DESCRIPTION_CAP),
      ...(posting.createdAt ? { postedAt: new Date(posting.createdAt).toISOString() } : {}),
      ...(comp ? { compHint: comp } : {}),
    };
  });
}

export async function fetchLever(
  company: CompanyConfig,
  fetchImpl: FetchLike = fetch,
): Promise<Posting[]> {
  const res = await fetchImpl(leverUrl(company.token));
  if (!res.ok) throw new Error(`Lever "${company.token}" → HTTP ${res.status}`);
  const raw = (await res.json()) as RawLeverResponse;
  return mapLever(raw, company.name);
}
