import type { RawAshbyResponse } from '../../types';

/**
 * Trimmed but shape-accurate Ashby board payload
 * (GET api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true).
 *
 * Ashby is the richest source: a structured `isRemote` boolean and a `compensation` block with
 * a scrapeable salary summary. `isListed: false` postings should be dropped by the adapter.
 * Captured against a live board 2026-07-02.
 */
export const ashbyFixture: RawAshbyResponse = {
  apiVersion: '1',
  jobs: [
    {
      id: '0907ae2a-5334-4d64-9a76-cc9428224546',
      title: 'Senior Software Engineer, Infrastructure',
      department: 'Engineering',
      team: 'Platform',
      employmentType: 'FullTime',
      location: 'Remote (US)',
      secondaryLocations: [{ location: 'New York, NY' }],
      publishedAt: '2026-06-11T17:21:26.410+00:00',
      isListed: true,
      isRemote: true,
      workplaceType: 'Remote',
      jobUrl: 'https://jobs.ashbyhq.com/example/0907ae2a-5334-4d64-9a76-cc9428224546',
      applyUrl: 'https://jobs.ashbyhq.com/example/0907ae2a-5334-4d64-9a76-cc9428224546/application',
      descriptionPlain:
        'Build the smart infrastructure powering the platform. Distributed systems, Go, AWS.',
      descriptionHtml: '<p>Build the smart infrastructure...</p>',
      compensation: {
        compensationTierSummary: '$191K – $291K • Offers Equity • Multiple Ranges',
        scrapeableCompensationSalarySummary: '$191K - $291K',
        summaryComponents: [
          { compensationType: 'EquityCashValue', minValue: null, maxValue: null, interval: '1 YEAR' },
          {
            compensationType: 'Salary',
            minValue: 191000,
            maxValue: 291000,
            currencyCode: 'USD',
            interval: '1 YEAR',
          },
        ],
      },
    },
    {
      id: '1a18bf3b-6445-4d75-8e87-dd9539335657',
      title: 'Director, Performance Marketing',
      department: 'Marketing',
      team: 'Growth',
      employmentType: 'FullTime',
      location: 'New York, NY (HQ)',
      publishedAt: '2026-06-01T12:00:00.000+00:00',
      isListed: true,
      isRemote: false,
      workplaceType: 'Onsite',
      jobUrl: 'https://jobs.ashbyhq.com/example/1a18bf3b-6445-4d75-8e87-dd9539335657',
      descriptionPlain: 'Lead performance marketing across paid channels.',
      compensation: null,
    },
    {
      id: '2b29c04c-7556-4e86-9f98-ee0640446768',
      title: 'Unlisted Draft Role',
      department: 'Engineering',
      employmentType: 'FullTime',
      location: 'Remote (US)',
      publishedAt: '2026-06-20T12:00:00.000+00:00',
      isListed: false,
      isRemote: true,
      jobUrl: 'https://jobs.ashbyhq.com/example/2b29c04c-7556-4e86-9f98-ee0640446768',
      descriptionPlain: 'Should never surface — not listed.',
    },
  ],
};
