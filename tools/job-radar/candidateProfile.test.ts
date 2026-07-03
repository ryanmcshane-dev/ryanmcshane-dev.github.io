import { describe, it, expect } from 'vitest';
import {
  buildCandidateProfile,
  estimateTokens,
  getCandidateProfile,
  loadResume,
  PROFILE_TOKEN_BUDGET,
  RESUME_PATH,
} from './candidateProfile';

const SAMPLE_RESUME = '# Ryan McShane — Résumé\n\nSENTINEL_RESUME_MARKER experience details.';

describe('estimateTokens', () => {
  it('approximates ~4 chars per token and grows with length', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });
});

describe('buildCandidateProfile', () => {
  const profile = buildCandidateProfile(SAMPLE_RESUME);

  it('leads with identity from the site config', () => {
    expect(profile).toContain('Candidate Profile — Ryan McShane');
    expect(profile).toContain('Senior Software Engineer & Tech Lead');
  });

  it('includes core skills pulled from the skills content model', () => {
    expect(profile).toContain('Spring Boot');
    expect(profile).toContain('Claude Code');
  });

  it('includes impact highlights with real metrics', () => {
    expect(profile).toContain('~11K');
    expect(profile).toContain('1,200+');
  });

  it('includes the AI-native statement, pillars, and toolkit', () => {
    expect(profile).toContain('Spec-driven development');
    expect(profile).toContain('Agentic coding craft');
    expect(profile).toMatch(/Toolkit: .*Claude Code/);
  });

  it('includes the flagship case study and the résumé passed in', () => {
    expect(profile).toContain('EOI integration');
    expect(profile).toContain('SENTINEL_RESUME_MARKER');
  });

  it('is deterministic for the same input', () => {
    expect(buildCandidateProfile(SAMPLE_RESUME)).toBe(profile);
  });
});

describe('loadResume', () => {
  it('reads the résumé path via the injected reader', () => {
    const seen: string[] = [];
    const out = loadResume((p) => {
      seen.push(p);
      return 'stub';
    });
    expect(out).toBe('stub');
    expect(seen[0]).toBe(RESUME_PATH);
  });

  it('reads the real résumé mirror from disk by default', () => {
    const resume = loadResume();
    expect(resume).toContain('Ryan McShane');
    expect(resume).toContain('Lincoln Financial Group');
  });
});

describe('getCandidateProfile', () => {
  const profile = getCandidateProfile();

  it('embeds real résumé experience', () => {
    expect(profile).toContain('Lincoln Financial Group');
    expect(profile).toContain('Cognizant');
  });

  it('stays within the token budget', () => {
    expect(estimateTokens(profile)).toBeLessThanOrEqual(PROFILE_TOKEN_BUDGET);
  });

  it('preserves confidentiality: generic phrasing only, no invented specifics', () => {
    const lower = profile.toLowerCase();
    expect(lower).toContain('major hcm vendor'); // the approved generic phrasing
    expect(lower).toContain('external hcm platform'); // partner referred to generically
    expect(lower).toContain('internal ai agent'); // internal agent stays unnamed
  });
});
