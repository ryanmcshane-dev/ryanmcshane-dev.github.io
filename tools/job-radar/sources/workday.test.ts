import { describe, it, expect } from 'vitest';
import {
  fetchWorkday,
  mapWorkdayDetail,
  workdayDetailUrl,
  workdayListUrl,
} from './workday';
import { collectPostings } from './index';
import { prefilter } from '../prefilter';
import type { CompanyConfig, FetchLike, FetchResponseLike } from '../types';
import { workdayDetails, workdayList } from './__fixtures__/workday.fixture';

const WORKDAY: CompanyConfig = {
  name: 'Workday',
  ats: 'workday',
  token: 'workday',
  workday: { tenant: 'workday', dc: 'wd5', site: 'Workday' },
};
const ok = (body: unknown): FetchResponseLike => ({ ok: true, status: 200, json: async () => body });
const notFound = (): FetchResponseLike => ({ ok: false, status: 404, json: async () => ({}) });

/** Route the list POST (URL ends /jobs) to the list fixture and each detail GET to its record. */
const routed: FetchLike = async (url) => {
  if (url.endsWith('/jobs')) return ok(workdayList);
  const path = url.replace('https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday', '');
  const detail = workdayDetails[path];
  return detail ? ok(detail) : notFound();
};

describe('workday URL builders', () => {
  it('builds the CXS list and detail URLs from the tenant config', () => {
    expect(workdayListUrl(WORKDAY.workday!)).toBe(
      'https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday/jobs',
    );
    expect(workdayDetailUrl(WORKDAY.workday!, '/job/x/Role_R1')).toBe(
      'https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday/job/x/Role_R1',
    );
  });
});

describe('mapWorkdayDetail', () => {
  const w = WORKDAY.workday!;
  const remote = mapWorkdayDetail(workdayDetails['/job/USA-CA-Remote/Senior-Software-Engineer_R-0001'], 'Workday', w);

  it('maps title, remote, country-qualified location, url, description, and ISO date', () => {
    expect(remote.source).toBe('workday');
    expect(remote.id).toMatch(/^[0-9a-f]{8}$/);
    expect(remote.title).toBe('Senior Software Engineer');
    expect(remote.remote).toBe(true); // remoteType "Remote"
    expect(remote.location).toBe('Pleasanton, CA — United States of America'); // country appended for the US gate
    expect(remote.url).toContain('/job/USA-CA-Remote/Senior-Software-Engineer_R-0001');
    expect(remote.descriptionText).toContain('event-driven backend');
    expect(remote.postedAt).toBe('2026-06-30');
  });

  it('reads hybrid from remoteType, and unknown when absent', () => {
    const hybrid = mapWorkdayDetail(workdayDetails['/job/USA-TN-Chattanooga/Staff-Platform-Engineer_R-0003'], 'Workday', w);
    const noFlag = mapWorkdayDetail(workdayDetails['/job/Kuala-Lumpur/Backend-Engineer_R-0002'], 'Workday', w);
    expect(hybrid.remote).toBe('hybrid');
    expect(noFlag.remote).toBe('unknown');
  });
});

describe('fetchWorkday', () => {
  it('POSTs the list per query, dedupes by path, and enriches each with its detail', async () => {
    const calls: Array<{ url: string; method?: string }> = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, method: init?.method });
      return routed(url);
    };
    const postings = await fetchWorkday(WORKDAY, fetchImpl, { queries: ['software engineer', 'backend engineer'] });

    // Two list POSTs (one per query); the same 4 postings dedupe; R-0004 has no detail → skipped ⇒ 3.
    expect(calls.filter((c) => c.url.endsWith('/jobs'))).toHaveLength(2);
    expect(calls.filter((c) => c.url.endsWith('/jobs')).every((c) => c.method === 'POST')).toBe(true);
    expect(postings).toHaveLength(3);
    expect(postings.every((p) => p.source === 'workday')).toBe(true);
    expect(postings.map((p) => p.title)).not.toContain('Data Engineer'); // detail-less → skipped
  });

  it('caps detail calls at maxDetails', async () => {
    const postings = await fetchWorkday(WORKDAY, routed, { queries: ['software engineer'], maxDetails: 1 });
    expect(postings).toHaveLength(1);
  });

  it('throws when the tenant config is missing', async () => {
    const bad: CompanyConfig = { name: 'X', ats: 'workday', token: 'x' };
    await expect(fetchWorkday(bad, routed)).rejects.toThrow(/missing its tenant config/);
  });

  it('throws (isolated per-company by collectPostings) when the list POST fails', async () => {
    const fetchImpl: FetchLike = async () => notFound();
    await expect(fetchWorkday(WORKDAY, fetchImpl)).rejects.toThrow(/HTTP 404/);
  });
});

describe('Workday → pre-filter integration', () => {
  it('drops the non-US role on the country-qualified location and keeps the US ones', async () => {
    const postings = await fetchWorkday(WORKDAY, routed, { queries: ['software engineer'] });
    const { kept, dropped } = prefilter(postings);

    expect(dropped.find((d) => d.reason === 'non-us-location')?.posting.title).toBe('Backend Engineer'); // KL/Malaysia
    const keptTitles = kept.map((k) => k.posting.title);
    expect(keptTitles).toEqual(expect.arrayContaining(['Senior Software Engineer', 'Staff Platform Engineer']));
  });
});

describe('collectPostings with a Workday company', () => {
  it('routes a workday company through the fetcher registry', async () => {
    const { postings, errors } = await collectPostings([WORKDAY], routed, { adzunaCreds: null });
    expect(errors).toEqual([]);
    expect(postings.some((p) => p.source === 'workday' && p.company === 'Workday')).toBe(true);
  });
});
