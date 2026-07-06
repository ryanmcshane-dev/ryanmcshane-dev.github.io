import { describe, it, expect } from 'vitest';
import type { FetchLike } from '../types';
import { fetchGreenhouse, greenhouseUrl, mapGreenhouse } from './greenhouse';
import { greenhouseFixture, greenhouseCurrencyRangeFixture } from './__fixtures__/greenhouse.fixture';

const stubFetch =
  (body: unknown, init: { ok?: boolean; status?: number } = {}): FetchLike =>
  async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });

describe('greenhouseUrl', () => {
  it('builds the content-included board URL and encodes the token', () => {
    expect(greenhouseUrl('airbnb')).toBe(
      'https://boards-api.greenhouse.io/v1/boards/airbnb/jobs?content=true',
    );
    expect(greenhouseUrl('a b')).toContain('a%20b');
  });
});

describe('mapGreenhouse', () => {
  const postings = mapGreenhouse(greenhouseFixture, 'Airbnb');

  it('maps every job to a normalized Posting', () => {
    expect(postings).toHaveLength(2);
    for (const p of postings) {
      expect(p.source).toBe('greenhouse');
      expect(p.company).toBe('Airbnb');
      expect(p.id).toMatch(/^[0-9a-f]{8}$/);
      expect(p.url).toMatch(/^https?:\/\//);
      expect(p.postedAt).toBeTruthy();
    }
  });

  it('reads the "Remote" Workplace Type as remote and decodes/strips the description', () => {
    const senior = postings[0];
    expect(senior.title).toBe('Senior Software Engineer, Payments');
    expect(senior.remote).toBe(true);
    expect(senior.descriptionText).toContain('Senior Software Engineer');
    expect(senior.descriptionText).not.toContain('<'); // tags stripped
    expect(senior.descriptionText).not.toContain('&lt;'); // entities decoded
  });

  it('flags a Hybrid Workplace Type as hybrid (kept, but a lesser fit), not a hard yes/no', () => {
    expect(postings[1].remote).toBe('hybrid');
    expect(postings[1].location).toBe('Berlin, Germany');
  });
});

describe('mapGreenhouse — boards without a "Workplace Type" field (e.g. Block)', () => {
  const [block] = mapGreenhouse(greenhouseCurrencyRangeFixture, 'Block');

  it('reads a yes/no "remote" metadata field (no Workplace Type, no "remote" in location)', () => {
    expect(block.location).toBe('New York, NY, United States of America');
    expect(block.remote).toBe(true);
  });

  it('formats a USD currency_range metadata field into a parseable compHint, skipping non-USD zones', () => {
    expect(block.compHint).toBe('$217,800–$326,800');
  });
});

describe('fetchGreenhouse', () => {
  it('fetches, parses, and maps using the injected fetch', async () => {
    const result = await fetchGreenhouse(
      { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb' },
      stubFetch(greenhouseFixture),
    );
    expect(result).toHaveLength(2);
    expect(result[0].company).toBe('Airbnb');
  });

  it('throws on a non-OK response', async () => {
    await expect(
      fetchGreenhouse(
        { name: 'Nope', ats: 'greenhouse', token: 'nope' },
        stubFetch({}, { ok: false, status: 404 }),
      ),
    ).rejects.toThrow(/HTTP 404/);
  });
});
