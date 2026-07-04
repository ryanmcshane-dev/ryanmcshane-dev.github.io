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
    expect(postings).toHaveLength(3);
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
});

describe('fetchAdzuna', () => {
  it('runs each query and merges the results', async () => {
    const urls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      urls.push(url);
      return ok(adzunaFixture);
    };
    const postings = await fetchAdzuna(CREDS, ['backend engineer', 'ai engineer'], fetchImpl);
    expect(urls).toHaveLength(2);
    expect(postings).toHaveLength(6); // 3 per query, dedupe happens later in collectPostings
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 429, json: async () => ({}) });
    await expect(fetchAdzuna(CREDS, ['x'], fetchImpl)).rejects.toThrow(/HTTP 429/);
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
