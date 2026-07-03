/**
 * Tier-1 deterministic scorer (SPEC.md §5 stage 4, §2).
 *
 * Free, no-LLM, fully transparent: every point is traceable to a fit-spec criterion. A survivor
 * starts at `baseScore` (it already cleared the hard gates), gains each weighted criterion whose
 * keywords appear in its title + description, and loses `hybridPenalty` if it's hybrid. The result
 * is clamped to 0–100 and mapped to a verdict. The pre-filter's soft flags flow straight into
 * `concerns`, and the absence of the top differentiator (AI-native) is called out.
 *
 * Keyword matching is the shared whole-word matcher (`matchesAnyKeyword`), the same one the
 * pre-filter uses, so `ai` hits "AI Engineer" but never "email".
 */
import type { FitSpec } from './fitSpec';
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

/** Score one pre-filtered posting deterministically against the fit spec. */
export function scoreFit(kept: KeptPosting, spec: FitSpec = fitSpec): FitScore {
  const { posting } = kept;
  const corpus = `${posting.title}\n${posting.descriptionText}`;

  const matched: string[] = [];
  const matchedIds = new Set<string>();
  let fit = spec.baseScore;
  for (const criterion of spec.weighted) {
    if (matchesAnyKeyword(corpus, criterion.keywords)) {
      fit += criterion.weight;
      matched.push(criterion.label);
      matchedIds.add(criterion.id);
    }
  }

  if (posting.remote === 'hybrid') fit -= spec.remote.hybridPenalty;
  fit = Math.max(0, Math.min(100, fit));

  const verdict = verdictFor(fit);

  // Concerns = the pre-filter's soft flags, plus the missing top differentiator if AI-native didn't hit.
  const concerns = [...kept.flags];
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
