import { describe, it, expect } from 'vitest';
import type { FetchLike } from '../types';
import { ashbyUrl, fetchAshby, mapAshby } from './ashby';
import { ashbyFixture } from './__fixtures__/ashby.fixture';

const stubFetch =
  (body: unknown, init: { ok?: boolean; status?: number } = {}): FetchLike =>
  async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });

describe('ashbyUrl', () => {
  it('builds the compensation-included job-board URL', () => {
    expect(ashbyUrl('openai')).toBe(
      'https://api.ashbyhq.com/posting-api/job-board/openai?includeCompensation=true',
    );
  });
});

describe('mapAshby', () => {
  const postings = mapAshby(ashbyFixture, 'OpenAI');

  it('drops unlisted postings', () => {
    expect(ashbyFixture.jobs).toHaveLength(3);
    expect(postings).toHaveLength(2);
    expect(postings.some((p) => p.title === 'Unlisted Draft Role')).toBe(false);
  });

  it('maps isRemote true → true and false → false', () => {
    const senior = postings.find((p) => p.title.startsWith('Senior'))!;
    const director = postings.find((p) => p.title.startsWith('Director'))!;
    expect(senior.remote).toBe(true);
    expect(director.remote).toBe(false);
  });

  it('flags an on-site job with workplaceType hybrid → "hybrid"', () => {
    const [hybrid] = mapAshby(
      {
        jobs: [
          {
            id: 'h',
            title: 'Role',
            jobUrl: 'https://jobs.ashbyhq.com/x/h',
            isRemote: false,
            workplaceType: 'Hybrid',
          },
        ],
      },
      'Acme',
    );
    expect(hybrid.remote).toBe('hybrid');
  });

  it('treats an on-site primary with a remote secondary location as remote', () => {
    const [p] = mapAshby(
      {
        jobs: [
          {
            id: 's',
            title: 'Role',
            jobUrl: 'https://jobs.ashbyhq.com/x/s',
            isRemote: false,
            secondaryLocations: [{ location: 'Remote (US)' }],
          },
        ],
      },
      'Acme',
    );
    expect(p.remote).toBe(true);
  });

  it('surfaces the scrapeable salary summary as compHint', () => {
    const senior = postings.find((p) => p.title.startsWith('Senior'))!;
    expect(senior.compHint).toBe('$191K - $291K');
  });

  it('uses jobUrl and publishedAt, and normalizes the id', () => {
    const senior = postings.find((p) => p.title.startsWith('Senior'))!;
    expect(senior.url).toBe(ashbyFixture.jobs[0].jobUrl);
    expect(senior.postedAt).toBe('2026-06-11T17:21:26.410+00:00');
    expect(senior.id).toMatch(/^[0-9a-f]{8}$/);
    expect(senior.source).toBe('ashby');
  });
});

describe('fetchAshby', () => {
  it('fetches, parses, and maps using the injected fetch', async () => {
    const result = await fetchAshby(
      { name: 'OpenAI', ats: 'ashby', token: 'openai' },
      stubFetch(ashbyFixture),
    );
    expect(result).toHaveLength(2);
  });

  it('throws on a non-OK response', async () => {
    await expect(
      fetchAshby({ name: 'Nope', ats: 'ashby', token: 'nope' }, stubFetch({}, { ok: false, status: 500 })),
    ).rejects.toThrow(/HTTP 500/);
  });
});
