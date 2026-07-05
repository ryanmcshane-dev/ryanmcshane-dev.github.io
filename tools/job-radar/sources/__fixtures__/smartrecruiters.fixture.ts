import type { RawSmartRecruitersDetail, RawSmartRecruitersListResponse } from '../../types';

/**
 * Shape-accurate SmartRecruiters payloads (ServiceNow, captured 2026-07-05). The list endpoint
 * returns summaries only (no description); the per-posting detail carries `applyUrl` + the
 * `jobAd.sections` description. Location is structured (`remote` / `hybrid` booleans, ISO-2
 * `country`).
 */
export const smartRecruitersList: RawSmartRecruitersListResponse = {
  totalFound: 3,
  content: [
    {
      id: '744000135700001',
      name: 'Senior Software Engineer, Platform',
      releasedDate: '2026-07-03T18:24:03.715Z',
      company: { identifier: 'ServiceNow', name: 'ServiceNow' },
      location: { city: 'San Diego', region: 'California', country: 'us', remote: true, fullLocation: 'San Diego, California, US' },
      experienceLevel: { id: 'mid_senior_level', label: 'Mid-Senior Level' },
    },
    {
      id: '744000135700002',
      name: 'Staff Database Engineer',
      releasedDate: '2026-07-02T10:00:00.000Z',
      company: { identifier: 'ServiceNow', name: 'ServiceNow' },
      location: { city: 'Toronto', region: 'Ontario', country: 'ca', remote: false, hybrid: true, fullLocation: 'Toronto, Ontario, Canada' },
      experienceLevel: { id: 'not_applicable', label: 'Not Applicable' },
    },
    {
      id: '744000135700003',
      name: 'Principal Backend Engineer',
      releasedDate: '2026-07-01T09:00:00.000Z',
      company: { identifier: 'ServiceNow', name: 'ServiceNow' },
      location: { city: 'Austin', region: 'Texas', country: 'us', fullLocation: 'Austin, Texas, US' },
    },
  ],
};

/** Detail records keyed by posting id — what `…/postings/{id}` returns. Entry 3 is intentionally absent
 *  so a test can exercise the "detail fetch failed → summary fallback" path. */
export const smartRecruitersDetails: Record<string, RawSmartRecruitersDetail> = {
  '744000135700001': {
    id: '744000135700001',
    name: 'Senior Software Engineer, Platform',
    releasedDate: '2026-07-03T18:24:03.715Z',
    postingUrl: 'https://jobs.smartrecruiters.com/ServiceNow/744000135700001-senior-software-engineer',
    applyUrl: 'https://jobs.smartrecruiters.com/ServiceNow/744000135700001-senior-software-engineer?apply',
    company: { identifier: 'ServiceNow', name: 'ServiceNow' },
    location: { city: 'San Diego', region: 'California', country: 'us', remote: true, fullLocation: 'San Diego, California, US' },
    jobAd: {
      sections: {
        jobDescription: {
          title: 'Job Description',
          text: '<p>Build scalable, multi-tenant distributed backend services in Java on AWS. Event-driven microservices, Kafka, strong observability.</p>',
        },
        qualifications: { title: 'Qualifications', text: '<p>7+ years backend, Spring Boot, distributed systems.</p>' },
      },
    },
  },
  '744000135700002': {
    id: '744000135700002',
    name: 'Staff Database Engineer',
    releasedDate: '2026-07-02T10:00:00.000Z',
    postingUrl: 'https://jobs.smartrecruiters.com/ServiceNow/744000135700002-staff-database-engineer',
    company: { identifier: 'ServiceNow', name: 'ServiceNow' },
    location: { city: 'Toronto', region: 'Ontario', country: 'ca', remote: false, hybrid: true, fullLocation: 'Toronto, Ontario, Canada' },
    jobAd: {
      sections: {
        jobDescription: { title: 'Job Description', text: '<p>Own the database platform. Kubernetes, reliability, on-call.</p>' },
      },
    },
  },
};
