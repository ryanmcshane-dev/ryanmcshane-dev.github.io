/**
 * The fit spec — Ryan's role preferences, versioned as typed data (SPEC.md §6).
 *
 * The *schema* is the engineering; the *values* are personal. Two consumers read it:
 *  - the pre-filter (Task 5) applies the hard gates: `remote.required`, `compFloorUsd`,
 *    `roleFamily`, `excludeTitles`;
 *  - the Tier-1 scorer (Task 6) applies `baseScore`, the `weighted` criteria, and `hybridPenalty`.
 *
 * Keyword matching is **whole-word, case-insensitive** (the scorer builds word-boundary regexes),
 * so short tokens like `ai`/`ml` match the term, not substrings inside `email`/`html`.
 *
 * Named `fitSpec.ts` (not `candidate-fit.spec.ts`) so the test runner doesn't mistake it for a
 * test file.
 */

/** A weighted "nice-to-have": matching any keyword adds `weight` to the fit score. */
export interface WeightedCriterion {
  id: string;
  label: string;
  /** Whole-word, case-insensitive terms matched against the posting title + description. */
  keywords: string[];
  /** Points added to the fit score when at least one keyword matches. */
  weight: number;
}

export interface FitSpec {
  /** Hard USD floor on stated comp (top of range). Unstated comp passes but is flagged. §6. */
  compFloorUsd: number;

  remote: {
    /** Remote (or clearly remote-open) required; on-site-only is dropped by the pre-filter. */
    required: boolean;
    /** Points deducted for a hybrid role — kept, but a lesser fit (Ryan's call). */
    hybridPenalty: number;
  };

  /** Title must match at least one — otherwise it isn't an eng / AI role Ryan wants (hard gate). */
  roleFamily: string[];

  /** A title matching any of these is too junior or off-track — hard drop (takes precedence). */
  excludeTitles: string[];

  /** Every surviving posting starts here, before weighted additions and the hybrid penalty. */
  baseScore: number;

  /** Weighted signals that raise the score (Tier-1 scorer). */
  weighted: WeightedCriterion[];

  /** Companies Ryan most wants to work at — their roles get a small nudge up the ranking. */
  preferredCompanies: string[];

  /** Points added when a posting's company is in `preferredCompanies`. */
  preferredBoost: number;
}

export const fitSpec: FitSpec = {
  compFloorUsd: 180_000,

  remote: {
    required: true,
    hybridPenalty: 20,
  },

  roleFamily: [
    'engineer',
    'developer',
    'software',
    'backend',
    'back-end',
    'platform',
    'infrastructure',
    'distributed systems',
    'machine learning',
    'ml engineer',
    'ai engineer',
    'sre',
    'architect',
    // "Member of Technical Staff" — the IC engineering title at OpenAI/Anthropic-style labs,
    // which carries none of the terms above. `excludeTitles` still filters out non-eng "…staff".
    'technical staff',
  ],

  excludeTitles: [
    'intern',
    'internship',
    'junior',
    'jr.',
    'entry level',
    'entry-level',
    'apprentice',
    'new grad',
    'graduate',
    'co-op',
    'associate',
    'manager',
    'director',
    'vp',
    'vice president',
    'head of',
    'recruiter',
    'sales',
    'marketing',
    'designer',
    'analyst',
  ],

  baseScore: 30,

  weighted: [
    {
      id: 'seniority',
      label: 'Senior / staff / lead level',
      keywords: ['senior', 'staff', 'principal', 'lead', 'sr.'],
      weight: 15,
    },
    {
      id: 'ai-native',
      label: 'Genuine AI-native engineering',
      keywords: ['ai', 'llm', 'agent', 'agentic', 'rag', 'machine learning', 'generative', 'genai'],
      weight: 20,
    },
    {
      id: 'backend-distributed',
      label: 'Backend / distributed / event-driven match',
      keywords: [
        'backend',
        'distributed',
        'event-driven',
        'event driven',
        'microservice',
        'microservices',
        'kafka',
        'streaming',
        'java',
        'spring',
        'aws',
      ],
      weight: 15,
    },
    {
      id: 'eng-culture',
      label: 'Strong engineering culture',
      keywords: ['engineering blog', 'open source', 'open-source', 'technical excellence'],
      weight: 5,
    },
    {
      id: 'product-company',
      label: 'Product engineering',
      keywords: ['product engineer', 'product engineering', 'product team'],
      weight: 5,
    },
  ],

  // Airbnb is Ryan's top choice among the reachable companies — a modest nudge, not a fit override.
  preferredCompanies: ['Airbnb'],
  preferredBoost: 8,
};
