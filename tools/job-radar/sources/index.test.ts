import { describe, it, expect } from 'vitest';
import type { CompanyConfig, FetchLike, Posting } from '../types';
import { collectPostings, dedupe } from './index';
import { greenhouseFixture } from './__fixtures__/greenhouse.fixture';
import { leverFixture } from './__fixtures__/lever.fixture';
import { ashbyFixture } from './__fixtures__/ashby.fixture';

/** Route by URL substring; tokens in `failTokens` reject (simulating a dead board). */
const router =
  (routes: Record<string, unknown>, failTokens: string[] = []): FetchLike =>
  async (url) => {
    if (failTokens.some((t) => url.includes(t))) throw new Error('network down');
    for (const [needle, body] of Object.entries(routes)) {
      if (url.includes(needle)) return { ok: true, status: 200, json: async () => body };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

const post = (over: Partial<Posting>): Posting => ({
  id: Math.random().toString(16).slice(2),
  source: 'greenhouse',
  company: 'Acme',
  title: 'Senior Software Engineer',
  location: 'Remote',
  remote: true,
  url: 'https://jobs.acme.com/1',
  descriptionText: 'desc',
  ...over,
});

describe('collectPostings', () => {
  const companies: CompanyConfig[] = [
    { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb' },
    { name: 'Spotify', ats: 'lever', token: 'spotify' },
    { name: 'OpenAI', ats: 'ashby', token: 'openai' },
    { name: 'DeadCo', ats: 'greenhouse', token: 'boom' },
  ];
  const fetchImpl = router(
    { airbnb: greenhouseFixture, spotify: leverFixture, openai: ashbyFixture },
    ['boom'],
  );

  it('fans out over every company and merges the results', async () => {
    const { postings } = await collectPostings(companies, fetchImpl);
    // 2 greenhouse + 2 lever + 2 listed ashby = 6
    expect(postings).toHaveLength(6);
    expect(new Set(postings.map((p) => p.company))).toEqual(
      new Set(['Airbnb', 'Spotify', 'OpenAI']),
    );
  });

  it('isolates a failing board: its error is collected, others still return', async () => {
    const { postings, errors } = await collectPostings(companies, fetchImpl);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ company: 'DeadCo', ats: 'greenhouse' });
    expect(postings.length).toBeGreaterThan(0); // the healthy boards still produced postings
  });

  it('returns no errors when every board is healthy', async () => {
    const { errors } = await collectPostings(companies.slice(0, 3), fetchImpl);
    expect(errors).toEqual([]);
  });
});

describe('dedupe', () => {
  it('merges postings sharing a URL, keeping the freshest', () => {
    const older = post({ id: 'a', url: 'https://x.com/1', postedAt: '2026-01-01T00:00:00Z' });
    const newer = post({ id: 'b', url: 'https://x.com/1/', postedAt: '2026-06-01T00:00:00Z' });
    const out = dedupe([older, newer]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('b');
  });

  it('merges postings sharing (company, title) even with different URLs', () => {
    const a = post({ id: 'a', company: 'Acme', title: 'Staff Engineer', url: 'https://a.com/1' });
    const b = post({ id: 'b', company: 'Acme', title: 'Staff Engineer', url: 'https://b.com/9' });
    expect(dedupe([a, b])).toHaveLength(1);
  });

  it('keeps genuinely distinct postings', () => {
    const a = post({ id: 'a', title: 'Backend Engineer', url: 'https://a.com/1' });
    const b = post({ id: 'b', title: 'Frontend Engineer', url: 'https://a.com/2' });
    expect(dedupe([a, b])).toHaveLength(2);
  });

  it('treats a missing postedAt as oldest', () => {
    const undated = post({ id: 'a', url: 'https://x.com/1' });
    const dated = post({ id: 'b', url: 'https://x.com/1', postedAt: '2026-06-01T00:00:00Z' });
    const out = dedupe([undated, dated]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('b');
  });
});
