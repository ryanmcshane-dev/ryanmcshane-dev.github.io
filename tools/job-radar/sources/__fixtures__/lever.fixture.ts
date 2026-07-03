import type { RawLeverResponse } from '../../types';

/**
 * Trimmed but shape-accurate Lever board payload
 * (GET api.lever.co/v0/postings/{token}?mode=json — a bare array).
 *
 * `descriptionPlain` is already plain text; `workplaceType` is Lever's remote signal.
 * `createdAt` is milliseconds since epoch. Captured against a live board 2026-07-02.
 */
export const leverFixture: RawLeverResponse = [
  {
    id: '66acb66f-de37-4d95-a353-874db92838ef',
    text: 'Staff Backend Engineer',
    categories: {
      commitment: 'Full-time',
      department: 'Engineering',
      location: 'Remote - Americas',
      team: 'Platform',
      allLocations: ['Remote - Americas'],
    },
    workplaceType: 'remote',
    country: 'US',
    hostedUrl: 'https://jobs.lever.co/example/66acb66f-de37-4d95-a353-874db92838ef',
    applyUrl: 'https://jobs.lever.co/example/66acb66f-de37-4d95-a353-874db92838ef/apply',
    createdAt: 1781109739214,
    descriptionPlain:
      'Own distributed, event-driven services in a high-throughput platform. Java/Kotlin, AWS.',
    description: '<p>Own distributed, event-driven services...</p>',
    salaryRange: { min: 190000, max: 240000, currency: 'USD', interval: 'per-year-salary' },
  },
  {
    id: '77bdc77f-ef48-4e06-b464-985ec93949fa',
    text: 'Product Designer',
    categories: {
      commitment: 'Full-time',
      department: 'Design',
      location: 'New York, NY',
      team: 'Brand',
      allLocations: ['New York, NY'],
    },
    workplaceType: 'on-site',
    country: 'US',
    hostedUrl: 'https://jobs.lever.co/example/77bdc77f-ef48-4e06-b464-985ec93949fa',
    createdAt: 1780000000000,
    descriptionPlain: 'Design brand experiences across the product.',
  },
];
