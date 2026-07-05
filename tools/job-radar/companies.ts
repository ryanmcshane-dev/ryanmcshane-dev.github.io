import type { CompanyConfig } from './types';

/**
 * Curated target companies with confirmed public ATS boards (probed live 2026-07-02).
 *
 * Curation is where the "reputable, no startups" gate (SPEC.md §6) is enforced up front. Ryan
 * opted to include the well-funded, AI-native "borderline" names alongside the clearly-established
 * ones. Tokens are the board slugs each ATS exposes; retarget by adding/removing entries.
 *
 * Probed unavailable via these public ATS APIs (would need a non-ATS v2 source): Netflix (empty
 * Lever board), Epic Games (no public Greenhouse/Lever/Ashby board), Figma & Brex (Lever 404).
 *
 * Excluded by choice: Coinbase — Ryan is not interested in tying his work to crypto.
 */
export const companies: CompanyConfig[] = [
  // Greenhouse — boards-api.greenhouse.io/v1/boards/{token}
  { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb' },
  { name: 'Stripe', ats: 'greenhouse', token: 'stripe' },
  { name: 'Databricks', ats: 'greenhouse', token: 'databricks' },
  { name: 'Dropbox', ats: 'greenhouse', token: 'dropbox' },
  { name: 'Pinterest', ats: 'greenhouse', token: 'pinterest' },
  { name: 'Block', ats: 'greenhouse', token: 'block' },
  // Domain-overlap / reputable-remote targets confirmed live 2026-07-05 (Ryan's fit guidance).
  { name: 'Affirm', ats: 'greenhouse', token: 'affirm' },
  { name: 'Twilio', ats: 'greenhouse', token: 'twilio' },

  // Lever — api.lever.co/v0/postings/{token}
  { name: 'Spotify', ats: 'lever', token: 'spotify' },
  { name: 'Plaid', ats: 'lever', token: 'plaid' },

  // Ashby — api.ashbyhq.com/posting-api/job-board/{token}
  { name: 'OpenAI', ats: 'ashby', token: 'openai' },
  { name: 'Notion', ats: 'ashby', token: 'notion' },
  { name: 'Ramp', ats: 'ashby', token: 'ramp' },
  { name: 'Linear', ats: 'ashby', token: 'linear' },
  { name: 'Vercel', ats: 'ashby', token: 'vercel' },

  // SmartRecruiters — api.smartrecruiters.com/v1/companies/{token} (token is case-sensitive)
  { name: 'ServiceNow', ats: 'smartrecruiters', token: 'ServiceNow' },

  // Workday CXS — HCM / group-benefits domain-overlap tier (tenant/dc/site discovered live 2026-07-05).
  { name: 'Workday', ats: 'workday', token: 'workday', workday: { tenant: 'workday', dc: 'wd5', site: 'Workday' } },
  { name: 'Unum', ats: 'workday', token: 'unum', workday: { tenant: 'unum', dc: 'wd1', site: 'External' } },
];
