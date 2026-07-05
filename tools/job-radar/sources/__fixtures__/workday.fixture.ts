import type { RawWorkdayDetail, RawWorkdayListResponse } from '../../types';

/**
 * Shape-accurate Workday CXS payloads (captured 2026-07-05). The list POST returns summaries whose
 * `locationsText` is often an opaque aggregate and whose `postedOn` is a human string; the per-posting
 * detail (GET …/{site}{externalPath}) carries the real country, `remoteType`, `jobDescription`, ISO
 * `startDate`, and canonical `externalUrl`.
 */
export const workdayList: RawWorkdayListResponse = {
  total: 4,
  jobPostings: [
    {
      title: 'Senior Software Engineer',
      externalPath: '/job/USA-CA-Remote/Senior-Software-Engineer_R-0001',
      locationsText: 'USA, CA, Remote',
      postedOn: 'Posted 5 Days Ago',
      bulletFields: ['R-0001'],
    },
    {
      title: 'Backend Engineer',
      externalPath: '/job/Kuala-Lumpur/Backend-Engineer_R-0002',
      locationsText: '2 Locations', // opaque aggregate — can't be US-gated without the detail
      postedOn: 'Posted 12 Days Ago',
      bulletFields: ['R-0002'],
    },
    {
      title: 'Staff Platform Engineer',
      externalPath: '/job/USA-TN-Chattanooga/Staff-Platform-Engineer_R-0003',
      locationsText: 'Chattanooga, TN',
      postedOn: 'Posted 2 Days Ago',
      bulletFields: ['R-0003'],
    },
    {
      title: 'Data Engineer',
      externalPath: '/job/USA-NY/Data-Engineer_R-0004', // detail intentionally absent → skipped
      locationsText: 'New York, NY',
      postedOn: 'Posted 8 Days Ago',
      bulletFields: ['R-0004'],
    },
  ],
};

const HOST = 'https://workday.wd5.myworkdayjobs.com';

/** Detail records keyed by externalPath. R-0004 is intentionally absent to exercise skip-on-failure. */
export const workdayDetails: Record<string, RawWorkdayDetail> = {
  '/job/USA-CA-Remote/Senior-Software-Engineer_R-0001': {
    jobPostingInfo: {
      id: 'R-0001',
      title: 'Senior Software Engineer',
      jobDescription:
        '<p>Build distributed, event-driven backend services in Java and Spring on AWS. Kafka, microservices.</p>',
      location: 'Pleasanton, CA',
      country: { descriptor: 'United States of America' },
      remoteType: 'Remote',
      timeType: 'Full time',
      startDate: '2026-06-30',
      externalUrl: `${HOST}/Workday/job/USA-CA-Remote/Senior-Software-Engineer_R-0001`,
      jobReqId: 'R-0001',
    },
  },
  '/job/Kuala-Lumpur/Backend-Engineer_R-0002': {
    jobPostingInfo: {
      id: 'R-0002',
      title: 'Backend Engineer',
      jobDescription: '<p>Backend services for the APAC region.</p>',
      location: 'Kuala Lumpur',
      country: { descriptor: 'Malaysia' },
      timeType: 'Full time',
      startDate: '2026-06-20',
      externalUrl: `${HOST}/Workday/job/Kuala-Lumpur/Backend-Engineer_R-0002`,
      jobReqId: 'R-0002',
    },
  },
  '/job/USA-TN-Chattanooga/Staff-Platform-Engineer_R-0003': {
    jobPostingInfo: {
      id: 'R-0003',
      title: 'Staff Platform Engineer',
      jobDescription:
        '<p>Own platform reliability and observability. Kubernetes, monitoring, on-call, SRE.</p>',
      location: 'Chattanooga, TN',
      country: { descriptor: 'United States of America' },
      remoteType: 'Hybrid',
      timeType: 'Full time',
      startDate: '2026-07-03',
      externalUrl: `${HOST}/Workday/job/USA-TN-Chattanooga/Staff-Platform-Engineer_R-0003`,
      jobReqId: 'R-0003',
    },
  },
};
