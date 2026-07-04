import type { RawAdzunaResponse } from '../../types';

/**
 * Shape-accurate Adzuna search payload
 * (GET api.adzuna.com/v1/api/jobs/us/search/1?what=…). Adzuna descriptions are plain-ish HTML
 * snippets, remote-ness is only discoverable from the text, and `salary_is_predicted: "1"` marks a
 * salary Adzuna estimated rather than one the posting stated.
 */
export const adzunaFixture: RawAdzunaResponse = {
  count: 3,
  results: [
    {
      id: '4711001',
      title: 'Senior Software Engineer, Backend',
      description:
        'Remote (US). Build event-driven microservices in Java and Spring Boot on AWS. Kafka, distributed systems.',
      created: '2026-07-01T09:00:00Z',
      redirect_url: 'https://www.adzuna.com/land/ad/4711001',
      company: { display_name: 'Acme Cloud' },
      location: { display_name: 'Remote, US', area: ['US'] },
      salary_min: 190000,
      salary_max: 230000,
      salary_is_predicted: '0',
      contract_time: 'full_time',
      category: { label: 'IT Jobs', tag: 'it-jobs' },
    },
    {
      id: '4711002',
      title: 'Staff Backend Engineer',
      description:
        'Hybrid role in Austin, TX. Design large-scale services. Occasional in-office collaboration.',
      created: '2026-06-30T12:00:00Z',
      redirect_url: 'https://www.adzuna.com/land/ad/4711002',
      company: { display_name: 'Globex' },
      location: { display_name: 'Austin, TX', area: ['US', 'Texas'] },
      salary_min: 210000,
      salary_max: 210000,
      salary_is_predicted: '1', // Adzuna estimate — must NOT be treated as stated comp
      contract_time: 'full_time',
    },
    {
      id: '4711003',
      title: 'Backend Engineer',
      description: 'On-site software engineering role building internal tools.',
      created: '2026-06-29T08:00:00Z',
      redirect_url: 'https://www.adzuna.com/land/ad/4711003',
      company: null, // missing company — adapter falls back to "Unknown"
      location: { display_name: 'New York, NY' },
      salary_is_predicted: '0',
    },
  ],
};
