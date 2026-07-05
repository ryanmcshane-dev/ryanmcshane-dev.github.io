import { describe, it, expect } from 'vitest';
import { companies } from './companies';

const VALID_ATS = new Set(['greenhouse', 'lever', 'ashby', 'smartrecruiters']);

describe('companies target list', () => {
  it('has entries, each with a valid ats and a non-empty slug token', () => {
    expect(companies.length).toBeGreaterThan(0);
    for (const c of companies) {
      expect(c.name.trim()).toBeTruthy();
      expect(VALID_ATS.has(c.ats)).toBe(true);
      // Board slug: lowercase for Greenhouse/Lever/Ashby; SmartRecruiters identifiers are case-sensitive.
      expect(c.token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('includes the domain-overlap / reputable-remote additions and the SmartRecruiters source', () => {
    const names = companies.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Affirm', 'Twilio', 'ServiceNow']));
    expect(companies.find((c) => c.name === 'ServiceNow')?.ats).toBe('smartrecruiters');
  });

  it('has no duplicate (ats, token) pairs', () => {
    const keys = companies.map((c) => `${c.ats}:${c.token}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes at least one of Ryan\'s named targets that has a live board', () => {
    const names = companies.map((c) => c.name);
    expect(names).toContain('Airbnb');
    expect(names).toContain('Block');
  });

  it('excludes Coinbase — Ryan opted out of crypto', () => {
    const tokens = companies.map((c) => c.token);
    const names = companies.map((c) => c.name);
    expect(names).not.toContain('Coinbase');
    expect(tokens).not.toContain('coinbase');
  });
});
