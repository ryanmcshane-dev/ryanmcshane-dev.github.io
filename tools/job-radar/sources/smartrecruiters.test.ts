import { describe, it, expect } from 'vitest';
import {
  fetchSmartRecruiters,
  mapSmartRecruitersDetail,
  mapSmartRecruitersSummary,
  smartRecruitersDetailUrl,
  smartRecruitersListUrl,
} from './smartrecruiters';
import { collectPostings } from './index';
import type { CompanyConfig, FetchLike, FetchResponseLike } from '../types';
import { smartRecruitersDetails, smartRecruitersList } from './__fixtures__/smartrecruiters.fixture';

const COMPANY: CompanyConfig = { name: 'ServiceNow', ats: 'smartrecruiters', token: 'ServiceNow' };
const ok = (body: unknown): FetchResponseLike => ({ ok: true, status: 200, json: async () => body });
const notFound = (): FetchResponseLike => ({ ok: false, status: 404, json: async () => ({}) });

/** Route the list URL to the list fixture and each detail URL to its record (404 when absent). */
const routed: FetchLike = async (url) => {
  if (url.includes('/postings?')) return ok(smartRecruitersList);
  const id = url.split('/postings/')[1];
  const detail = smartRecruitersDetails[id];
  return detail ? ok(detail) : notFound();
};

describe('smartRecruiters URL builders', () => {
  it('builds a US-filtered list URL with the keyword and encoded token', () => {
    const url = smartRecruitersListUrl('ServiceNow', 'engineer');
    expect(url).toContain('/companies/ServiceNow/postings?');
    expect(url).toContain('country=us');
    expect(url).toContain('q=engineer');
  });

  it('builds a detail URL for a posting id', () => {
    expect(smartRecruitersDetailUrl('ServiceNow', '744000135700001')).toBe(
      'https://api.smartrecruiters.com/v1/companies/ServiceNow/postings/744000135700001',
    );
  });
});

describe('mapSmartRecruitersDetail', () => {
  const posting = mapSmartRecruitersDetail(smartRecruitersDetails['744000135700001'], 'ServiceNow');

  it('maps title, structured remote, canonical apply URL, description, and date', () => {
    expect(posting.source).toBe('smartrecruiters');
    expect(posting.id).toMatch(/^[0-9a-f]{8}$/);
    expect(posting.title).toBe('Senior Software Engineer, Platform');
    expect(posting.remote).toBe(true); // location.remote === true
    expect(posting.url).toBe(smartRecruitersDetails['744000135700001'].applyUrl);
    expect(posting.location).toBe('San Diego, California, US');
    expect(posting.descriptionText).toContain('distributed backend');
    expect(posting.descriptionText).toContain('Spring Boot'); // qualifications section folded in
    expect(posting.postedAt).toBe('2026-07-03T18:24:03.715Z');
  });

  it('reads hybrid from the structured location flag', () => {
    const hybrid = mapSmartRecruitersDetail(smartRecruitersDetails['744000135700002'], 'ServiceNow');
    expect(hybrid.remote).toBe('hybrid');
  });
});

describe('mapSmartRecruitersSummary (detail-less fallback)', () => {
  it('maps a summary with no description and a derived public URL', () => {
    const summary = smartRecruitersList.content![2]; // Principal Backend Engineer, no remote flag
    const posting = mapSmartRecruitersSummary(summary, 'ServiceNow');
    expect(posting.remote).toBe('unknown');
    expect(posting.descriptionText).toBe('');
    expect(posting.url).toBe('https://jobs.smartrecruiters.com/ServiceNow/744000135700003');
  });
});

describe('fetchSmartRecruiters', () => {
  it('lists, dedupes across queries, and enriches each posting with its detail', async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      calls.push(url);
      return routed(url);
    };
    const postings = await fetchSmartRecruiters(COMPANY, fetchImpl, { queries: ['engineer', 'developer'] });

    // 2 list calls (one per query) + 3 detail calls; the two queries return the same 3 → deduped.
    expect(calls.filter((u) => u.includes('/postings?'))).toHaveLength(2);
    expect(postings).toHaveLength(3);
    expect(postings.every((p) => p.source === 'smartrecruiters')).toBe(true);
  });

  it('isolates a failed detail call by falling back to the description-less summary', async () => {
    // Posting #3 has no detail record → 404 → summary fallback (no description, guessed URL).
    const postings = await fetchSmartRecruiters(COMPANY, routed, { queries: ['engineer'] });
    const fallback = postings.find((p) => p.title === 'Principal Backend Engineer')!;
    expect(fallback.descriptionText).toBe('');
    expect(fallback.remote).toBe('unknown');
    expect(fallback.url).toBe('https://jobs.smartrecruiters.com/ServiceNow/744000135700003');
  });

  it('caps the number of detail calls at maxDetails', async () => {
    const postings = await fetchSmartRecruiters(COMPANY, routed, { queries: ['engineer'], maxDetails: 1 });
    expect(postings).toHaveLength(1);
  });

  it('throws (isolated per-company by collectPostings) when the list call fails', async () => {
    const fetchImpl: FetchLike = async () => notFound();
    await expect(fetchSmartRecruiters(COMPANY, fetchImpl)).rejects.toThrow(/HTTP 404/);
  });
});

describe('collectPostings with a SmartRecruiters company', () => {
  it('routes a smartrecruiters company through the fetcher registry', async () => {
    const { postings, errors } = await collectPostings([COMPANY], routed, { adzunaCreds: null });
    expect(errors).toEqual([]);
    expect(postings.some((p) => p.source === 'smartrecruiters' && p.company === 'ServiceNow')).toBe(true);
  });
});
