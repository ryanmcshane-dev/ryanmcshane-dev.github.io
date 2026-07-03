import { describe, it, expect } from 'vitest';
import { scoreFit, scorePostings, verdictFor } from './scoreRules';
import { fitSpec } from './fitSpec';
import type { KeptPosting } from './prefilter';
import type { Posting } from './types';

function makePosting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: overrides.id ?? 'id-1',
    source: overrides.source ?? 'ashby',
    company: overrides.company ?? 'OpenAI',
    title: overrides.title ?? 'Senior Software Engineer',
    location: overrides.location ?? 'Remote',
    remote: overrides.remote ?? true,
    url: overrides.url ?? 'https://example.com/jobs/1',
    descriptionText: overrides.descriptionText ?? '',
    postedAt: overrides.postedAt,
    compHint: overrides.compHint,
  };
}

function makeKept(posting: Partial<Posting> = {}, flags: string[] = []): KeptPosting {
  return { posting: makePosting(posting), flags };
}

const BASE = fitSpec.baseScore;
const weight = (id: string) => fitSpec.weighted.find((w) => w.id === id)!.weight;

describe('verdictFor thresholds', () => {
  it.each<[number, string]>([
    [90, 'strong'],
    [75, 'strong'],
    [74, 'possible'],
    [55, 'possible'],
    [54, 'weak'],
    [30, 'weak'],
    [29, 'skip'],
    [0, 'skip'],
  ])('maps %d → %s', (fit, verdict) => {
    expect(verdictFor(fit)).toBe(verdict);
  });
});

describe('scoreFit — additive, transparent breakdown', () => {
  it('adds base + every matched criterion weight', () => {
    const kept = makeKept({
      title: 'Senior Software Engineer',
      descriptionText: 'Build LLM agents on a distributed backend.',
    });
    const { fit, matched } = scoreFit(kept);
    // seniority (senior) + ai-native (llm/agent) + backend-distributed (distributed/backend).
    expect(fit).toBe(BASE + weight('seniority') + weight('ai-native') + weight('backend-distributed'));
    expect(fit).toBe(80);
    expect(matched).toHaveLength(3);
    expect(matched).toContain('Genuine AI-native engineering');
  });

  it('scores a base-only survivor at weak with no matched criteria', () => {
    const { fit, verdict, matched } = scoreFit(makeKept({ title: 'Software Engineer' }));
    expect(fit).toBe(BASE);
    expect(verdict).toBe('weak');
    expect(matched).toEqual([]);
  });

  it('flags AI-native absence as a concern when it does not match', () => {
    const { concerns } = scoreFit(makeKept({ title: 'Backend Engineer', descriptionText: 'Kafka, Java, AWS.' }));
    expect(concerns).toContain('no AI-native engineering signal');
  });

  it('does not add the AI-native concern when it matches', () => {
    const { concerns } = scoreFit(
      makeKept({ title: 'AI Engineer', descriptionText: 'Agentic systems and RAG.' }),
    );
    expect(concerns).not.toContain('no AI-native engineering signal');
  });
});

describe('scoreFit — hybrid penalty', () => {
  it('subtracts the hybrid penalty and can drop the verdict a tier', () => {
    const desc = 'Build LLM agents on a distributed backend.';
    const remoteScore = scoreFit(makeKept({ descriptionText: desc, remote: true }));
    const hybridScore = scoreFit(
      makeKept({ descriptionText: desc, remote: 'hybrid' }, ['hybrid (partial remote)']),
    );
    expect(hybridScore.fit).toBe(remoteScore.fit - fitSpec.remote.hybridPenalty);
    expect(remoteScore.verdict).toBe('strong');
    expect(hybridScore.verdict).toBe('possible');
    expect(hybridScore.concerns).toContain('hybrid (partial remote)');
  });

  it('never scores below 0', () => {
    const { fit } = scoreFit(makeKept({ title: 'Software Engineer', remote: 'hybrid' }));
    expect(fit).toBe(Math.max(0, BASE - fitSpec.remote.hybridPenalty));
    expect(fit).toBeGreaterThanOrEqual(0);
  });
});

describe('scoreFit — whole-word matching and flag pass-through', () => {
  it('does not treat "email"/"html" as an AI-native signal', () => {
    const { matched, concerns } = scoreFit(
      makeKept({ title: 'Software Engineer', descriptionText: 'Own our email and html templates.' }),
    );
    expect(matched).not.toContain('Genuine AI-native engineering');
    expect(concerns).toContain('no AI-native engineering signal');
  });

  it('carries the pre-filter flags into concerns', () => {
    const { concerns } = scoreFit(makeKept({ title: 'Backend Engineer' }, ['comp unstated']));
    expect(concerns).toContain('comp unstated');
  });

  it('writes a grounded rationale naming the score, company, and title', () => {
    const { rationale, fit } = scoreFit(makeKept({ company: 'Stripe', title: 'Staff AI Engineer' }));
    expect(rationale).toContain('Stripe');
    expect(rationale).toContain('Staff AI Engineer');
    expect(rationale).toContain(`${fit}/100`);
  });
});

describe('scorePostings', () => {
  it('attaches a FitScore to each posting, preserving fields and order', () => {
    const kept: KeptPosting[] = [
      makeKept({ id: 'a', title: 'Senior AI Engineer', descriptionText: 'LLM agents.' }),
      makeKept({ id: 'b', title: 'Software Engineer' }),
    ];
    const scored = scorePostings(kept);
    expect(scored.map((s) => s.id)).toEqual(['a', 'b']);
    expect(scored[0].score.fit).toBeGreaterThan(scored[1].score.fit);
    expect(scored[0].company).toBe('OpenAI');
    expect(scored[0]).toHaveProperty('score.verdict');
  });
});
