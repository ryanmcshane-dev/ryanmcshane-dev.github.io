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
    // seniority (senior) + ai-native (llm/agent) + backend-core (distributed/backend).
    expect(fit).toBe(BASE + weight('seniority') + weight('ai-native') + weight('backend-core'));
    expect(fit).toBe(74);
    expect(matched).toHaveLength(3);
    expect(matched).toContain('AI-native engineering (a SWE who drives AI adoption)');
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
    // Rich enough to land 'strong' (≥75) when remote: senior + backend + ai-native + platform.
    const desc = 'Build LLM agents on a distributed backend with strong observability.';
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

const boost = (id: string) => fitSpec.preferredCompanies.find((g) => g.id === id)!.boost;

describe('scoreFit — preferred-company boost', () => {
  it('adds the top-choice boost and a "Top-choice company" signal for Airbnb', () => {
    const desc = 'Senior backend engineer.';
    const preferred = scoreFit(makeKept({ company: 'Airbnb', descriptionText: desc }));
    const other = scoreFit(makeKept({ company: 'OpenAI', descriptionText: desc })); // not preferred
    expect(preferred.fit).toBe(other.fit + boost('top-choice'));
    expect(preferred.matched).toContain('Top-choice company');
    expect(other.matched.some((m) => m.startsWith('Top-choice'))).toBe(false);
  });

  it('boosts HCM domain-overlap companies (whole-word, so "ADP, Inc." matches)', () => {
    const desc = 'Senior backend engineer.';
    const workday = scoreFit(makeKept({ company: 'Workday', descriptionText: desc }));
    const adp = scoreFit(makeKept({ company: 'ADP, Inc.', descriptionText: desc }));
    const other = scoreFit(makeKept({ company: 'OpenAI', descriptionText: desc }));
    expect(workday.fit).toBe(other.fit + boost('hcm-domain-overlap'));
    expect(adp.fit).toBe(other.fit + boost('hcm-domain-overlap'));
    expect(workday.matched.some((m) => m.includes('HCM'))).toBe(true);
  });

  it('gives the big reputable-remote orgs a smaller boost than domain overlap', () => {
    const desc = 'Senior backend engineer.';
    const stripe = scoreFit(makeKept({ company: 'Stripe', descriptionText: desc }));
    const other = scoreFit(makeKept({ company: 'OpenAI', descriptionText: desc }));
    expect(stripe.fit).toBe(other.fit + boost('reputable-remote'));
    expect(boost('reputable-remote')).toBeLessThan(boost('hcm-domain-overlap'));
  });

  it('never pushes the score past 100', () => {
    const { fit } = scoreFit(
      makeKept({
        company: 'Airbnb',
        title: 'Senior Staff Software Engineer',
        descriptionText:
          'LLM agents, distributed backend, Kafka, AWS, observability, open source, product engineering.',
      }),
    );
    expect(fit).toBeLessThanOrEqual(100);
  });
});

describe('scoreFit — pure-ML / research title demotion', () => {
  const mlMismatch = fitSpec.mismatches.find((m) => m.id === 'pure-ml-research')!;

  it('subtracts the penalty and flags a pure-ML title, ranking it below a peer backend role', () => {
    const desc = 'Senior distributed backend systems on AWS with Kafka.';
    const ml = scoreFit(makeKept({ title: 'Staff Machine Learning Engineer', descriptionText: desc }));
    const backend = scoreFit(makeKept({ title: 'Staff Software Engineer', descriptionText: desc }));
    expect(ml.fit).toBe(backend.fit - mlMismatch.penalty);
    expect(ml.fit).toBeLessThan(backend.fit);
    expect(ml.concerns).toContain(mlMismatch.label);
  });

  it('does not penalize a backend role that merely mentions ML in its description', () => {
    // Title-only matching: "machine learning" in the body must not trigger the demotion.
    const mlLabel = fitSpec.mismatches.find((m) => m.id === 'pure-ml-research')!.label;
    const { concerns } = scoreFit(
      makeKept({
        title: 'Senior Backend Engineer',
        descriptionText: 'Support the machine learning platform team with data pipelines.',
      }),
    );
    expect(concerns).not.toContain(mlLabel);
  });
});

describe('scoreFit — off-target discipline demotion', () => {
  const offTarget = fitSpec.mismatches.find((m) => m.id === 'off-target-role')!;

  // Big-company JD boilerplate mentions backend/platform/AI regardless of the role, so an off-target
  // title (mobile, enterprise-app, sales) must be pulled *below* an otherwise-identical backend role.
  const richDesc =
    'Distributed backend on AWS with Kafka, strong observability, and LLM-powered tooling.';

  it.each(['Staff Android Software Engineer', 'Senior Salesforce Engineer', 'Senior Solutions Architect'])(
    'demotes "%s" below a peer backend role and flags it',
    (title) => {
      const off = scoreFit(makeKept({ title, descriptionText: richDesc }));
      const backend = scoreFit(makeKept({ title: 'Senior Software Engineer', descriptionText: richDesc }));
      expect(off.fit).toBe(backend.fit - offTarget.penalty);
      expect(off.fit).toBeLessThan(backend.fit);
      expect(off.concerns).toContain(offTarget.label);
    },
  );
});

describe('scoreFit — platform / reliability signal', () => {
  it('credits observability / SRE work as Ryan\'s secondary strength', () => {
    const { matched } = scoreFit(
      makeKept({
        title: 'Senior Site Reliability Engineer',
        descriptionText: 'Own observability with Splunk and New Relic; on-call and monitoring.',
      }),
    );
    expect(matched).toContain("Platform / reliability / observability — Ryan's secondary strength");
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
