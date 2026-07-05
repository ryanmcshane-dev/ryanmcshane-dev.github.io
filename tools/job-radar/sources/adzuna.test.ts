import { describe, it, expect } from 'vitest';
import {
  ADZUNA_QUERIES,
  adzunaUrl,
  fetchAdzuna,
  getAdzunaCreds,
  mapAdzuna,
  type AdzunaCreds,
} from './adzuna';
import { collectPostings } from './index';
import { prefilter } from '../prefilter';
import type { FetchLike, FetchResponseLike } from '../types';
import { adzunaFixture } from './__fixtures__/adzuna.fixture';

const CREDS: AdzunaCreds = { appId: 'test-id', appKey: 'test-key' };
const ok = (body: unknown): FetchResponseLike => ({ ok: true, status: 200, json: async () => body });

describe('getAdzunaCreds', () => {
  it('returns null when either credential is missing', () => {
    expect(getAdzunaCreds({})).toBeNull();
    expect(getAdzunaCreds({ ADZUNA_APP_ID: 'x' })).toBeNull();
    expect(getAdzunaCreds({ ADZUNA_APP_KEY: 'y' })).toBeNull();
  });

  it('returns trimmed credentials when both are present', () => {
    expect(getAdzunaCreds({ ADZUNA_APP_ID: ' id ', ADZUNA_APP_KEY: ' key ' })).toEqual({
      appId: 'id',
      appKey: 'key',
    });
  });
});

describe('adzunaUrl', () => {
  it('targets the country/page search endpoint with credentials and query', () => {
    const url = adzunaUrl('us', 1, 'senior software engineer', CREDS);
    expect(url).toContain('/v1/api/jobs/us/search/1?');
    expect(url).toContain('app_id=test-id');
    expect(url).toContain('app_key=test-key');
    expect(url).toContain('what=senior+software+engineer');
    expect(url).toContain('full_time=1');
  });
});

describe('mapAdzuna', () => {
  const postings = mapAdzuna(adzunaFixture);

  it('maps every result to a normalized posting with source "adzuna"', () => {
    expect(postings).toHaveLength(4);
    for (const p of postings) {
      expect(p.source).toBe('adzuna');
      expect(p.id).toMatch(/^[0-9a-f]{8}$/);
      expect(p.url).toMatch(/^https?:\/\//);
      expect(p.title).toBeTruthy();
    }
  });

  it('infers remote / hybrid / unknown from the text', () => {
    expect(postings[0].remote).toBe(true); // "Remote (US)"
    expect(postings[1].remote).toBe('hybrid'); // "Hybrid role"
    expect(postings[2].remote).toBe('unknown'); // "On-site" — no remote signal
  });

  it('uses stated salary but ignores Adzuna-predicted salary', () => {
    expect(postings[0].compHint).toBe('$190,000 - $230,000'); // salary_is_predicted "0"
    expect(postings[1].compHint).toBeUndefined(); // salary_is_predicted "1"
    expect(postings[2].compHint).toBeUndefined(); // no salary
  });

  it('falls back to "Unknown" when the company is missing', () => {
    expect(postings[2].company).toBe('Unknown');
  });

  it('maps the real live payload shape (extra __CLASS__/adref fields ignored, terse "US" location)', () => {
    const live = postings[3]; // the entry captured verbatim from the live API
    expect(live.company).toBe('Applied Information Sciences');
    expect(live.location).toBe('US');
    expect(live.compHint).toBe('$100,000 - $150,000');
    expect(live.postedAt).toBe('2026-07-05T06:40:19Z');
    expect(live.id).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('fetchAdzuna', () => {
  it('runs each query and merges the results', async () => {
    const urls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      urls.push(url);
      return ok(adzunaFixture);
    };
    const { postings, errors } = await fetchAdzuna(CREDS, ['backend engineer', 'ai engineer'], fetchImpl);
    expect(urls).toHaveLength(2);
    expect(errors).toEqual([]);
    expect(postings).toHaveLength(8); // 4 per query, dedupe happens later in collectPostings
  });

  it('isolates a failing query (e.g. 503) and keeps results from the others', async () => {
    // Regression for the live free-tier failure mode: one transient error must not discard the batch.
    const fetchImpl: FetchLike = async (url) =>
      url.includes('backend')
        ? { ok: false, status: 503, json: async () => ({}) }
        : ok(adzunaFixture);
    const { postings, errors } = await fetchAdzuna(CREDS, ['backend engineer', 'ai engineer'], fetchImpl);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/HTTP 503/);
    expect(postings).toHaveLength(4); // the successful "ai engineer" query still contributes
  });

  it('ships a non-empty default query list', () => {
    expect(ADZUNA_QUERIES.length).toBeGreaterThan(0);
  });
});

describe('collectPostings with Adzuna', () => {
  it('includes Adzuna postings when credentials are provided', async () => {
    const fetchImpl: FetchLike = async () => ok(adzunaFixture);
    const { postings, errors } = await collectPostings([], fetchImpl, {
      adzunaCreds: CREDS,
      adzunaQueries: ['backend engineer'],
    });
    expect(errors).toEqual([]);
    expect(postings.some((p) => p.source === 'adzuna')).toBe(true);
  });

  it('skips Adzuna entirely when credentials are null', async () => {
    const fetchImpl: FetchLike = async () => ok(adzunaFixture);
    const { postings } = await collectPostings([], fetchImpl, { adzunaCreds: null });
    expect(postings).toEqual([]);
  });

  it('isolates an Adzuna failure as a source error without failing the run', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const { postings, errors } = await collectPostings([], fetchImpl, {
      adzunaCreds: CREDS,
      adzunaQueries: ['x'],
    });
    expect(postings).toEqual([]);
    expect(errors).toEqual([{ company: 'Adzuna', ats: 'adzuna', message: expect.stringContaining('HTTP 500') }]);
  });
});

describe('Adzuna → pre-filter integration', () => {
  it('lets the hard gates filter aggregator noise (below-floor comp dropped, US role kept + flagged)', () => {
    const { kept, dropped } = prefilter(mapAdzuna(adzunaFixture));

    // The live-shape "$100,000 - $150,000" role is below the $180K floor.
    const belowFloor = dropped.find((d) => d.reason === 'below-comp-floor');
    expect(belowFloor?.posting.compHint).toBe('$100,000 - $150,000');

    // The floor-clearing remote US role survives.
    const survivor = kept.find((k) => k.posting.compHint === '$190,000 - $230,000');
    expect(survivor).toBeDefined();

    // The unknown-remote US role (no salary) is kept but flagged for both remote and comp.
    const flagged = kept.find((k) => k.posting.remote === 'unknown');
    expect(flagged?.flags).toEqual(expect.arrayContaining(['comp unstated', 'remote unstated']));
  });
});

// Live regression test: only runs when real credentials are present (locally, or CI with secrets).
// It's the guard against Adzuna changing its response shape; skipped otherwise so the suite stays
// hermetic and offline by default.
const liveCreds = getAdzunaCreds();
describe.skipIf(!liveCreds)('Adzuna live API', () => {
  it('fetches real US postings that map to the normalized Posting shape', async () => {
    // Use the full default query set so one transient 503 (per-query isolation) doesn't zero it out.
    const { postings, errors } = await fetchAdzuna(liveCreds!);
    if (errors.length > 0) console.warn('Adzuna live errors:', errors);
    expect(postings.length).toBeGreaterThan(0);
    for (const p of postings.slice(0, 10)) {
      expect(p.source).toBe('adzuna');
      expect(p.id).toMatch(/^[0-9a-f]{8}$/);
      expect(p.url).toMatch(/^https?:\/\//);
      expect(p.title.length).toBeGreaterThan(0);
      expect([true, false, 'hybrid', 'unknown']).toContain(p.remote);
      if (p.compHint !== undefined) expect(p.compHint).toMatch(/\$[\d,]/);
    }
  }, 30_000);
});
