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

  it('gates to US-only with US signals and a non-US block list', () => {
    expect(fitSpec.location.usOnly).toBe(true);
    expect(fitSpec.location.usSignals).toEqual(
      expect.arrayContaining(['united states', 'usa', 'us']),
    );
    expect(fitSpec.location.blockRegions).toEqual(
      expect.arrayContaining(['brazil', 'india', 'canada']),
    );
    // The two lists must not overlap, or a US signal and a block would both fire on one term.
    const overlap = fitSpec.location.usSignals.filter((s) =>
      fitSpec.location.blockRegions.includes(s),
    );
    expect(overlap).toEqual([]);
  });

  it('weights backend / core engineering the highest of the nice-to-haves', () => {
    // Ryan's guidance: senior backend is his strongest, lowest-friction target — so it, not
    // AI-native, is the top-weighted signal. AI-native is a real but secondary wedge.
    const byId = Object.fromEntries(fitSpec.weighted.map((w) => [w.id, w.weight]));
    const max = Math.max(...fitSpec.weighted.map((w) => w.weight));
    expect(byId['backend-core']).toBe(max);
    expect(byId['ai-native']).toBeLessThan(byId['backend-core']);
  });

  it('demotes pure-ML / research titles below Ryan\'s backend/platform core', () => {
    const byId = Object.fromEntries(fitSpec.mismatches.map((m) => [m.id, m]));
    const ml = byId['pure-ml-research'];
    expect(ml).toBeDefined();
    expect(ml.penalty).toBeGreaterThan(0);
    expect(ml.keywords).toEqual(
      expect.arrayContaining(['machine learning engineer', 'research scientist', 'data scientist']),
    );
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
      ...fitSpec.location.usSignals,
      ...fitSpec.location.blockRegions,
      ...fitSpec.weighted.flatMap((w) => w.keywords),
      ...fitSpec.mismatches.flatMap((m) => m.keywords),
      ...fitSpec.preferredCompanies.flatMap((g) => g.match),
    ];
    for (const kw of all) {
      expect(kw).toBe(kw.toLowerCase());
      expect(kw.trim()).toBe(kw);
    }
  });

  it('gives every mismatch a unique id, keywords, and a positive penalty', () => {
    const ids = new Set<string>();
    for (const m of fitSpec.mismatches) {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.keywords.length).toBeGreaterThan(0);
      expect(m.penalty).toBeGreaterThan(0);
      ids.add(m.id);
    }
    expect(ids.size).toBe(fitSpec.mismatches.length);
  });

  it('base score plus all additive boosts stay within a sane 0–100 frame', () => {
    const maxWeighted = fitSpec.weighted.reduce((sum, w) => sum + w.weight, 0);
    const maxBoost = Math.max(...fitSpec.preferredCompanies.map((g) => g.boost));
    expect(fitSpec.baseScore).toBeGreaterThan(0);
    expect(fitSpec.baseScore + maxWeighted + maxBoost).toBeLessThanOrEqual(100);
    expect(fitSpec.remote.hybridPenalty).toBeLessThanOrEqual(fitSpec.baseScore);
  });

  it('nudges Ryan\'s top-choice and domain-overlap companies with positive boosts', () => {
    // Every group has a positive boost, at least one match token, and a reason.
    for (const g of fitSpec.preferredCompanies) {
      expect(g.id).toBeTruthy();
      expect(g.boost).toBeGreaterThan(0);
      expect(g.match.length).toBeGreaterThan(0);
      expect(g.reason.trim()).toBeTruthy();
    }
    const allMatches = fitSpec.preferredCompanies.flatMap((g) => g.match);
    // Airbnb (top choice) and the HCM domain-overlap names Ryan called out are represented.
    expect(allMatches).toEqual(expect.arrayContaining(['airbnb', 'workday', 'adp', 'ukg']));
  });
});
