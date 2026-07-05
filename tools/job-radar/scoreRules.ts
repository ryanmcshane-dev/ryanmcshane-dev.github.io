/**
 * Tier-1 deterministic scorer (SPEC.md §5 stage 4, §2).
 *
 * Free, no-LLM, fully transparent: every point is traceable to a fit-spec criterion. A survivor
 * starts at `baseScore` (it already cleared the hard gates), gains each weighted criterion whose
 * keywords appear in its title + description, loses a `mismatches` penalty when its *title* reads as
 * a weaker-fit role family (pure ML / research), loses `hybridPenalty` if it's hybrid, and gains a
 * preferred-company boost (the highest-matching group). The result is clamped to 0–100 and mapped to
 * a verdict. The pre-filter's soft flags flow straight into `concerns`, and the absence of the top
 * differentiator (AI-native) is called out.
 *
 * Weights encode Ryan's resume-strength ordering (see `fitSpec.ts`): backend/core engineering is the
 * strongest signal, platform/reliability and AI-native are secondary, and a pure-ML/research title
 * is a demotion — so a Machine Learning role no longer outranks a senior backend role by default.
 *
 * Keyword matching is the shared whole-word matcher (`matchesAnyKeyword`), the same one the
 * pre-filter uses, so `ai` hits "AI Engineer" but never "email".
 */
import type { FitSpec, PreferredCompanyGroup } from './fitSpec';
import { fitSpec } from './fitSpec';
import type { KeptPosting } from './prefilter';
import type { FitScore, ScoredPosting, Verdict } from './types';
import { matchesAnyKeyword } from './util';

/** Score thresholds → verdict. Base-only (no signals) lands at `weak`; a hybrid dock can reach `skip`. */
export function verdictFor(fit: number): Verdict {
  if (fit >= 75) return 'strong';
  if (fit >= 55) return 'possible';
  if (fit >= 30) return 'weak';
  return 'skip';
}

/** The highest-boost preferred-company group a posting's company matches, or `undefined`. Groups don't stack. */
export function bestPreferredGroup(
  company: string,
  groups: PreferredCompanyGroup[],
): PreferredCompanyGroup | undefined {
  let best: PreferredCompanyGroup | undefined;
  for (const group of groups) {
    if (matchesAnyKeyword(company, group.match) && (best === undefined || group.boost > best.boost)) {
      best = group;
    }
  }
  return best;
}

/** Score one pre-filtered posting deterministically against the fit spec. */
export function scoreFit(kept: KeptPosting, spec: FitSpec = fitSpec): FitScore {
  const { posting } = kept;
  const corpus = `${posting.title}\n${posting.descriptionText}`;

  const matched: string[] = [];
  const concerns = [...kept.flags];
  const matchedIds = new Set<string>();
  let fit = spec.baseScore;

  // Weighted nice-to-haves: matched against the title + description.
  for (const criterion of spec.weighted) {
    if (matchesAnyKeyword(corpus, criterion.keywords)) {
      fit += criterion.weight;
      matched.push(criterion.label);
      matchedIds.add(criterion.id);
    }
  }

  // Role-type mismatches: matched against the *title* only (the role *is* this). A pure ML / research
  // title is a weaker fit than Ryan's core, so it subtracts and is called out — but not a hard drop.
  for (const mismatch of spec.mismatches) {
    if (matchesAnyKeyword(posting.title, mismatch.keywords)) {
      fit -= mismatch.penalty;
      concerns.push(mismatch.label);
    }
  }

  if (posting.remote === 'hybrid') fit -= spec.remote.hybridPenalty;

  // Preferred-company nudge: the highest-matching group wins (groups don't stack).
  const preferred = bestPreferredGroup(posting.company, spec.preferredCompanies);
  if (preferred) {
    fit += preferred.boost;
    matched.push(preferred.reason);
  }

  fit = Math.max(0, Math.min(100, fit));

  const verdict = verdictFor(fit);

  // Concerns already hold the pre-filter's soft flags + any mismatch; add the missing top
  // differentiator (AI-native) when it didn't hit.
  if (!matchedIds.has('ai-native')) concerns.push('no AI-native engineering signal');

  const rationale = [
    `${posting.title} at ${posting.company} scores ${fit}/100 (${verdict}) on the Tier-1 deterministic pass.`,
    matched.length > 0 ? `Matched: ${matched.join('; ')}.` : 'Matched none of the weighted criteria.',
    concerns.length > 0 ? `Concerns: ${concerns.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { fit, verdict, rationale, matched, concerns };
}

/** Score a batch, attaching each `FitScore` to its posting. Ordering is preserved (ranking is the pipeline's job). */
export function scorePostings(kept: KeptPosting[], spec: FitSpec = fitSpec): ScoredPosting[] {
  return kept.map((entry) => ({ ...entry.posting, score: scoreFit(entry, spec) }));
}
