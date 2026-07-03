/**
 * Deterministic pre-filter (SPEC.md §5 stage 3, gates from §6).
 *
 * Cheap, no-LLM hard gates that shrink the candidate set before scoring. Every drop is recorded
 * with a machine-readable reason, and every survivor carries soft `flags` (comp unstated, hybrid,
 * remote unstated) that flow downstream into the fit rationale. Pure: postings in → result out.
 *
 * Gate order (first failing gate wins the drop reason):
 *  1. `excludeTitles` — too-junior / off-track title. Takes precedence (§6).
 *  2. `roleFamily`    — title must read as an engineering / AI role.
 *  3. remote          — on-site-only is dropped; hybrid / unknown are kept (unknown is flagged).
 *  4. comp floor      — a *stated* USD top-of-range below the floor is dropped; unstated / non-USD
 *                       comp passes and is flagged (never dropped on comp we can't read).
 */
import type { FitSpec } from './fitSpec';
import { fitSpec } from './fitSpec';
import type { Posting } from './types';
import { matchedKeywords, matchesAnyKeyword } from './util';

/** Why a posting was dropped by a hard gate. */
export type DropReason = 'excluded-title' | 'off-role-family' | 'on-site-only' | 'below-comp-floor';

/** A posting removed by a hard gate, with the reason and a short human detail. */
export interface DroppedPosting {
  posting: Posting;
  reason: DropReason;
  detail: string;
}

/** A survivor, bundled with the soft flags to carry into scoring / rationale. */
export interface KeptPosting {
  posting: Posting;
  /** e.g. 'comp unstated', 'hybrid (partial remote)', 'remote unstated'. */
  flags: string[];
}

export interface PrefilterResult {
  kept: KeptPosting[];
  dropped: DroppedPosting[];
}

/** Currencies / dollar variants that are clearly *not* US dollars — we can't check a USD floor. */
const NON_USD = /£|€|¥|₹|\b(?:cad|eur|gbp|aud|inr|jpy|chf|sgd|nzd|hkd|brl|mxn)\b|\b(?:ca|au|nz|hk|s)\$/i;

/**
 * Monetary amounts we trust: `$`-prefixed, comma-grouped (e.g. `180,000`), or `USD`-suffixed —
 * each with an optional `k` / `m` scale. Requiring one of those signals keeps noise like a bare
 * "401k" (retirement plan) from being read as $401,000.
 */
const MONEY =
  /\$\s*(\d[\d,]*(?:\.\d+)?)\s*([km])?|(\d{1,3}(?:,\d{3})+)\s*([km])?|(\d+(?:\.\d+)?)\s*([km])?\s*usd/gi;

/** Below this, a parsed figure is treated as noise (hourly rate, stray number), not a salary. */
const MIN_PLAUSIBLE_SALARY = 1000;

function scale(suffix: string | undefined): number {
  if (!suffix) return 1;
  return suffix.toLowerCase() === 'm' ? 1_000_000 : 1_000;
}

/**
 * Highest annual USD figure a comp string states, or `null` when none is confidently readable
 * (empty, non-USD currency, or nothing parseable). Callers treat `null` as "comp unstated": pass
 * the gate, flag it — never drop on comp we can't verify.
 */
export function parseTopUsd(compHint: string | undefined): number | null {
  if (!compHint) return null;
  if (NON_USD.test(compHint)) return null;

  const values: number[] = [];
  MONEY.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MONEY.exec(compHint)) !== null) {
    const [, dollarNum, dollarSuffix, commaNum, commaSuffix, usdNum, usdSuffix] = match;
    const rawNum = dollarNum ?? commaNum ?? usdNum;
    const suffix = dollarSuffix ?? commaSuffix ?? usdSuffix;
    if (rawNum === undefined) continue;
    const value = Number(rawNum.replace(/,/g, '')) * scale(suffix);
    if (Number.isFinite(value) && value >= MIN_PLAUSIBLE_SALARY) values.push(value);
  }

  return values.length > 0 ? Math.max(...values) : null;
}

/** Apply the deterministic hard gates from the fit spec. */
export function prefilter(postings: Posting[], spec: FitSpec = fitSpec): PrefilterResult {
  const kept: KeptPosting[] = [];
  const dropped: DroppedPosting[] = [];

  for (const posting of postings) {
    const title = posting.title;

    // 1. Excluded titles take precedence — a too-junior / off-track title is an immediate drop.
    const excluded = matchedKeywords(title, spec.excludeTitles);
    if (excluded.length > 0) {
      dropped.push({ posting, reason: 'excluded-title', detail: `title matches: ${excluded.join(', ')}` });
      continue;
    }

    // 2. Role family — the title must read as an engineering / AI role.
    if (!matchesAnyKeyword(title, spec.roleFamily)) {
      dropped.push({ posting, reason: 'off-role-family', detail: 'title matches no role-family term' });
      continue;
    }

    // 3. Remote — on-site-only is a hard drop; hybrid / unknown survive (unknown gets flagged).
    if (spec.remote.required && posting.remote === false) {
      dropped.push({ posting, reason: 'on-site-only', detail: 'role is on-site only' });
      continue;
    }

    // 4. Comp floor — drop only when a stated USD top-of-range is below the floor.
    const topUsd = parseTopUsd(posting.compHint);
    if (topUsd !== null && topUsd < spec.compFloorUsd) {
      dropped.push({
        posting,
        reason: 'below-comp-floor',
        detail: `stated top comp ${topUsd} below ${spec.compFloorUsd} floor`,
      });
      continue;
    }

    // Survivor — collect soft flags for the rationale.
    const flags: string[] = [];
    if (topUsd === null) flags.push(posting.compHint ? 'comp not USD-verifiable' : 'comp unstated');
    if (posting.remote === 'hybrid') flags.push('hybrid (partial remote)');
    if (posting.remote === 'unknown') flags.push('remote unstated');

    kept.push({ posting, flags });
  }

  return { kept, dropped };
}
