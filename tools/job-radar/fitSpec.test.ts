import { describe, it, expect } from 'vitest';
import { fitSpec } from './fitSpec';

describe('fitSpec confirmed values (SPEC.md §6)', () => {
  it('encodes the $180K USD comp floor', () => {
    expect(fitSpec.compFloorUsd).toBe(180_000);
  });

  it('requires remote and penalizes (does not drop) hybrid', () => {
    expect(fitSpec.remote.required).toBe(true);
    expect(fitSpec.remote.hybridPenalty).toBeGreaterThan(0);
  });

  it('gates on an engineering/AI role family and excludes junior/off-track titles', () => {
    expect(fitSpec.roleFamily).toContain('engineer');
    expect(fitSpec.excludeTitles).toEqual(
      expect.arrayContaining(['intern', 'junior', 'manager']),
    );
  });

  it('weights AI-native engineering the highest of the nice-to-haves', () => {
    const byId = Object.fromEntries(fitSpec.weighted.map((w) => [w.id, w.weight]));
    const max = Math.max(...fitSpec.weighted.map((w) => w.weight));
    expect(byId['ai-native']).toBe(max);
  });
});

describe('fitSpec structural invariants', () => {
  it('has non-empty gate lists', () => {
    expect(fitSpec.roleFamily.length).toBeGreaterThan(0);
    expect(fitSpec.excludeTitles.length).toBeGreaterThan(0);
    expect(fitSpec.weighted.length).toBeGreaterThan(0);
  });

  it('gives every weighted criterion a unique id, a label, keywords, and a positive weight', () => {
    const ids = new Set<string>();
    for (const w of fitSpec.weighted) {
      expect(w.id).toBeTruthy();
      expect(w.label).toBeTruthy();
      expect(w.keywords.length).toBeGreaterThan(0);
      expect(w.weight).toBeGreaterThan(0);
      ids.add(w.id);
    }
    expect(ids.size).toBe(fitSpec.weighted.length);
  });

  it('keeps all keywords lowercase (matcher lowercases input)', () => {
    const all = [
      ...fitSpec.roleFamily,
      ...fitSpec.excludeTitles,
      ...fitSpec.weighted.flatMap((w) => w.keywords),
    ];
    for (const kw of all) {
      expect(kw).toBe(kw.toLowerCase());
      expect(kw.trim()).toBe(kw);
    }
  });

  it('base score plus all additive boosts stay within a sane 0–100 frame', () => {
    const maxWeighted = fitSpec.weighted.reduce((sum, w) => sum + w.weight, 0);
    expect(fitSpec.baseScore).toBeGreaterThan(0);
    expect(fitSpec.baseScore + maxWeighted + fitSpec.preferredBoost).toBeLessThanOrEqual(100);
    expect(fitSpec.remote.hybridPenalty).toBeLessThanOrEqual(fitSpec.baseScore);
  });

  it('nudges Ryan\'s top-choice companies with a small positive boost', () => {
    expect(fitSpec.preferredCompanies).toContain('Airbnb');
    expect(fitSpec.preferredBoost).toBeGreaterThan(0);
  });
});
