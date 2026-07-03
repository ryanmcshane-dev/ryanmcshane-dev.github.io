import { describe, it, expect } from 'vitest';
import { companies } from './companies';

const VALID_ATS = new Set(['greenhouse', 'lever', 'ashby']);

describe('companies target list', () => {
  it('has entries, each with a valid ats and a non-empty slug token', () => {
    expect(companies.length).toBeGreaterThan(0);
    for (const c of companies) {
      expect(c.name.trim()).toBeTruthy();
      expect(VALID_ATS.has(c.ats)).toBe(true);
      expect(c.token).toMatch(/^[a-z0-9-]+$/); // lowercase board slug
    }
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
