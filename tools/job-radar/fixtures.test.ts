import { describe, it, expect } from 'vitest';
import { greenhouseFixture } from './sources/__fixtures__/greenhouse.fixture';
import { leverFixture } from './sources/__fixtures__/lever.fixture';
import { ashbyFixture } from './sources/__fixtures__/ashby.fixture';
import { adzunaFixture } from './sources/__fixtures__/adzuna.fixture';

/**
 * These assert the fixtures still exercise the raw-payload traits the adapters (Task 2) rely on.
 * If an ATS changes its shape and we refresh a fixture, this test catches a fixture that no
 * longer covers the case it was meant to.
 */

describe('greenhouse fixture', () => {
  it('carries jobs with the fields the adapter maps', () => {
    expect(greenhouseFixture.jobs.length).toBeGreaterThanOrEqual(2);
    for (const job of greenhouseFixture.jobs) {
      expect(typeof job.id).toBe('number');
      expect(job.title).toBeTruthy();
      expect(job.absolute_url).toMatch(/^https?:\/\//);
      expect(job.location?.name).toBeTruthy();
    }
  });

  it('keeps description content HTML-entity-encoded (adapter must decode then strip)', () => {
    const withContent = greenhouseFixture.jobs.find((j) => j.content);
    expect(withContent?.content).toContain('&lt;');
  });

  it('covers both a Remote and a non-Remote Workplace Type', () => {
    const types = greenhouseFixture.jobs.flatMap((j) =>
      (j.metadata ?? []).filter((m) => m.name === 'Workplace Type').map((m) => m.value),
    );
    expect(types).toContain('Remote');
    expect(types).toContain('Hybrid');
  });
});

describe('lever fixture', () => {
  it('is a bare array of postings with millisecond createdAt', () => {
    expect(Array.isArray(leverFixture)).toBe(true);
    expect(leverFixture.length).toBeGreaterThanOrEqual(2);
    for (const p of leverFixture) {
      expect(p.text).toBeTruthy();
      expect(p.hostedUrl).toMatch(/^https?:\/\//);
      expect(typeof p.createdAt).toBe('number');
      expect(p.createdAt).toBeGreaterThan(1_000_000_000_000); // ms, not seconds
    }
  });

  it('covers a remote and an on-site workplaceType', () => {
    const kinds = leverFixture.map((p) => p.workplaceType);
    expect(kinds).toContain('remote');
    expect(kinds).toContain('on-site');
  });
});

describe('ashby fixture', () => {
  it('carries jobs with the structured fields the adapter maps', () => {
    expect(ashbyFixture.jobs.length).toBeGreaterThanOrEqual(3);
    for (const job of ashbyFixture.jobs) {
      expect(job.title).toBeTruthy();
      expect(job.jobUrl).toMatch(/^https?:\/\//);
      expect(typeof job.isRemote).toBe('boolean');
    }
  });

  it('includes a remote role with scrapeable compensation', () => {
    const remotePaid = ashbyFixture.jobs.find(
      (j) => j.isRemote && j.compensation?.scrapeableCompensationSalarySummary,
    );
    expect(remotePaid?.compensation?.scrapeableCompensationSalarySummary).toMatch(/\$\d/);
  });

  it('includes an unlisted role for the adapter to drop', () => {
    expect(ashbyFixture.jobs.some((j) => j.isListed === false)).toBe(true);
  });
});

describe('adzuna fixture', () => {
  it('carries results with the fields the adapter maps', () => {
    expect(adzunaFixture.results.length).toBeGreaterThanOrEqual(3);
    for (const job of adzunaFixture.results) {
      expect(typeof job.id).toBe('string');
      expect(job.title).toBeTruthy();
      expect(job.redirect_url).toMatch(/^https?:\/\//);
    }
  });

  it('covers stated vs Adzuna-predicted salary, and a remote / hybrid / on-site spread', () => {
    expect(adzunaFixture.results.map((j) => j.salary_is_predicted)).toEqual(
      expect.arrayContaining(['0', '1']),
    );
    const text = adzunaFixture.results.map((j) => j.description.toLowerCase()).join(' | ');
    expect(text).toContain('remote');
    expect(text).toContain('hybrid');
    expect(text).toContain('on-site');
  });
});
