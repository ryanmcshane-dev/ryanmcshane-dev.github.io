import { describe, it, expect } from 'vitest';
import type { FetchLike } from '../types';
import { fetchLever, leverUrl, mapLever } from './lever';
import { leverFixture } from './__fixtures__/lever.fixture';

const stubFetch =
  (body: unknown, init: { ok?: boolean; status?: number } = {}): FetchLike =>
  async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });

describe('leverUrl', () => {
  it('builds the JSON-mode postings URL', () => {
    expect(leverUrl('spotify')).toBe('https://api.lever.co/v0/postings/spotify?mode=json');
  });
});

describe('mapLever', () => {
  const postings = mapLever(leverFixture, 'Spotify');

  it('maps title from `text`, url from `hostedUrl`, and ms createdAt to ISO postedAt', () => {
    const staff = postings[0];
    expect(staff.title).toBe('Staff Backend Engineer');
    expect(staff.url).toBe(leverFixture[0].hostedUrl);
    expect(staff.postedAt).toBe(new Date(1781109739214).toISOString());
    expect(staff.company).toBe('Spotify');
    expect(staff.source).toBe('lever');
  });

  it('maps workplaceType remote → true and on-site → false', () => {
    expect(postings[0].remote).toBe(true);
    expect(postings[1].remote).toBe(false);
  });

  it('flags workplaceType hybrid → "hybrid"', () => {
    const [hybrid] = mapLever(
      [{ id: 'h', text: 'Role', hostedUrl: 'https://x/1', workplaceType: 'hybrid' }],
      'Acme',
    );
    expect(hybrid.remote).toBe('hybrid');
  });

  it('falls back to "remote" in the location text when workplaceType is absent', () => {
    const [p] = mapLever(
      [{ id: 'r', text: 'Role', hostedUrl: 'https://x/2', categories: { location: 'Remote - US' } }],
      'Acme',
    );
    expect(p.remote).toBe(true);
  });

  it('derives a comp hint from salaryRange when present', () => {
    expect(postings[0].compHint).toBe('USD 190K–USD 240K');
    expect(postings[1].compHint).toBeUndefined();
  });
});

describe('fetchLever', () => {
  it('handles the bare-array response body', async () => {
    const result = await fetchLever(
      { name: 'Spotify', ats: 'lever', token: 'spotify' },
      stubFetch(leverFixture),
    );
    expect(result).toHaveLength(2);
  });

  it('returns empty for an empty board without throwing', async () => {
    const result = await fetchLever(
      { name: 'Netflix', ats: 'lever', token: 'netflix' },
      stubFetch([]),
    );
    expect(result).toEqual([]);
  });

  it('throws on a non-OK response', async () => {
    await expect(
      fetchLever({ name: 'Nope', ats: 'lever', token: 'nope' }, stubFetch({}, { ok: false, status: 404 })),
    ).rejects.toThrow(/HTTP 404/);
  });
});
