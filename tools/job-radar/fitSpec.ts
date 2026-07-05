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

/**
 * A role-type *mismatch*: keywords matched against the posting **title only** (the role *is* this,
 * not merely *mentions* it). Matching subtracts `penalty` and records a concern. Used for role
 * families that read as a weaker fit than Ryan's core (senior backend / platform) — e.g. a posting
 * *titled* as a pure ML / research role. Not a hard drop: such a role can still surface if it scores
 * well otherwise.
 */
export interface MismatchCriterion {
  id: string;
  label: string;
  /** Whole-word, case-insensitive terms matched against the posting **title**. */
  keywords: string[];
  /** Points subtracted from the fit score when at least one keyword matches. */
  penalty: number;
}

/**
 * A preferred-company group. Any posting whose company name matches one of `match` (whole-word,
 * case-insensitive, so `adp` hits "ADP, Inc.") gets `boost` added and `reason` recorded in the
 * rationale. Grouped by the *kind* of preference so the boost reflects the strategic signal, not a
 * single name. Groups don't stack — the highest-boost matching group wins.
 */
export interface PreferredCompanyGroup {
  id: string;
  /** Whole-word tokens matched against `posting.company`. Lowercase. */
  match: string[];
  /** Points added when a posting's company matches (highest-matching group wins; no stacking). */
  boost: number;
  /** Short, human reason surfaced in the fit rationale's `matched` list. */
  reason: string;
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

  /**
   * Geography gate: Ryan is US-based and only wants US roles. A posting whose location reads as
   * clearly outside the US is a hard drop; an unrecognized location survives but is flagged for
   * confirmation (same "never drop on what we can't verify" rule the comp gate uses). §6.
   */
  location: {
    /** When true, the pre-filter drops postings whose location reads as clearly non-US. */
    usOnly: boolean;
    /**
     * Whole-word signals that a posting is US-based / US-remote-eligible. Any match ⇒ kept as US,
     * and takes precedence over `blockRegions` (so "Remote — US & Canada" stays).
     */
    usSignals: string[];
    /** Whole-word signals a posting is outside the US — dropped unless a `usSignals` term is also present. */
    blockRegions: string[];
  };

  /** Title must match at least one — otherwise it isn't an eng / AI role Ryan wants (hard gate). */
  roleFamily: string[];

  /** A title matching any of these is too junior or off-track — hard drop (takes precedence). */
  excludeTitles: string[];

  /** Every surviving posting starts here, before weighted additions and the hybrid penalty. */
  baseScore: number;

  /** Weighted signals that raise the score (Tier-1 scorer). */
  weighted: WeightedCriterion[];

  /** Role-type mismatches that *lower* the score — matched against the title only. */
  mismatches: MismatchCriterion[];

  /**
   * Companies Ryan most wants to work at, grouped by the kind of preference. A matching company's
   * roles get a small additive nudge (not a fit override) so they rank higher, all else equal.
   */
  preferredCompanies: PreferredCompanyGroup[];
}

export const fitSpec: FitSpec = {
  compFloorUsd: 180_000,

  remote: {
    required: true,
    hybridPenalty: 20,
  },

  location: {
    usOnly: true,
    // US country terms, every state + DC, and a few hubs whose names carry no state token. Any hit
    // reads the posting as US-eligible. "North America" is included: it always includes the US, so a
    // US-based candidate qualifies.
    usSignals: [
      'united states',
      'usa',
      'u.s.a.',
      'u.s.',
      'us',
      'us-based',
      'us based',
      'united states of america',
      'north america',
      'nationwide',
      // states + DC
      'alabama',
      'alaska',
      'arizona',
      'arkansas',
      'california',
      'colorado',
      'connecticut',
      'delaware',
      'florida',
      'georgia',
      'hawaii',
      'idaho',
      'illinois',
      'indiana',
      'iowa',
      'kansas',
      'kentucky',
      'louisiana',
      'maine',
      'maryland',
      'massachusetts',
      'michigan',
      'minnesota',
      'mississippi',
      'missouri',
      'montana',
      'nebraska',
      'nevada',
      'new hampshire',
      'new jersey',
      'new mexico',
      'new york',
      'north carolina',
      'north dakota',
      'ohio',
      'oklahoma',
      'oregon',
      'pennsylvania',
      'rhode island',
      'south carolina',
      'south dakota',
      'tennessee',
      'texas',
      'utah',
      'vermont',
      'virginia',
      'washington',
      'west virginia',
      'wisconsin',
      'wyoming',
      'district of columbia',
      // major hubs whose names carry no state token
      'san francisco',
      'new york city',
      'nyc',
      'seattle',
      'boston',
      'austin',
      'chicago',
      'denver',
      'atlanta',
      'los angeles',
      'san jose',
      'palo alto',
      'mountain view',
      'sunnyvale',
      'brooklyn',
    ],
    // Non-US countries, regions, and their best-known hubs seen (or likely) on these boards.
    blockRegions: [
      'brazil',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'pune',
      'mumbai',
      'delhi',
      'gurgaon',
      'noida',
      'chennai',
      'india',
      'canada',
      'toronto',
      'vancouver',
      'montreal',
      'ontario',
      'united kingdom',
      'uk',
      'england',
      'london',
      'scotland',
      'ireland',
      'dublin',
      'germany',
      'berlin',
      'munich',
      'france',
      'paris',
      'spain',
      'madrid',
      'barcelona',
      'portugal',
      'lisbon',
      'netherlands',
      'amsterdam',
      'poland',
      'warsaw',
      'krakow',
      'romania',
      'bucharest',
      'ukraine',
      'czech',
      'prague',
      'switzerland',
      'sweden',
      'stockholm',
      'norway',
      'denmark',
      'copenhagen',
      'finland',
      'italy',
      'belgium',
      'greece',
      'australia',
      'sydney',
      'melbourne',
      'new zealand',
      'singapore',
      'japan',
      'tokyo',
      'china',
      'hong kong',
      'south korea',
      'philippines',
      'indonesia',
      'vietnam',
      'thailand',
      'malaysia',
      'taiwan',
      'israel',
      'mexico',
      'argentina',
      'colombia',
      'chile',
      'costa rica',
      'uruguay',
      'peru',
      'south africa',
      'nigeria',
      'kenya',
      'egypt',
      'united arab emirates',
      'uae',
      'dubai',
      'abu dhabi',
      'europe',
      'eu',
      'emea',
      'apac',
      'latam',
      'latin america',
      'south america',
    ],
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

  // Weights encode Ryan's resume-strength ordering (his guidance): senior *backend* is the
  // strongest, lowest-friction target, so `backend-core` carries the most weight; platform/
  // reliability is a genuine secondary strength; AI-native engineering is a real but *secondary*
  // wedge (a SWE who drives AI adoption — not a pure ML/AI role), so it no longer outweighs backend.
  weighted: [
    {
      id: 'backend-core',
      label: "Backend / distributed / event-driven — Ryan's core strength",
      keywords: [
        'backend',
        'back-end',
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
        'ecs',
        'oauth',
      ],
      weight: 20,
    },
    {
      id: 'seniority',
      label: 'Senior / staff / lead level',
      keywords: ['senior', 'staff', 'principal', 'lead', 'sr.'],
      weight: 14,
    },
    {
      id: 'platform-reliability',
      label: "Platform / reliability / observability — Ryan's secondary strength",
      keywords: [
        'platform',
        'reliability',
        'sre',
        'site reliability',
        'observability',
        'splunk',
        'new relic',
        'datadog',
        'monitoring',
        'infrastructure',
        'devops',
        'developer productivity',
        'developer experience',
      ],
      weight: 10,
    },
    {
      id: 'ai-native',
      label: 'AI-native engineering (a SWE who drives AI adoption)',
      keywords: ['ai', 'llm', 'agent', 'agentic', 'rag', 'genai', 'generative', 'copilot', 'applied ai'],
      weight: 10,
    },
    {
      id: 'eng-culture',
      label: 'Strong engineering culture',
      keywords: ['engineering blog', 'open source', 'open-source', 'technical excellence'],
      weight: 3,
    },
    {
      id: 'product-company',
      label: 'Product engineering',
      keywords: ['product engineer', 'product engineering', 'product team'],
      weight: 3,
    },
  ],

  // Off-discipline *titles* are demoted. Big-company JDs mention backend / platform / AI in their
  // boilerplate regardless of the role, which inflates every senior posting's description-based
  // score — so the *title* is what actually says what the role is. Matched against the title only (a
  // backend role that merely mentions ML in its description isn't touched). Penalties are large
  // enough to pull an off-target role below a true backend / platform / AI-adjacent one, but it's not
  // a hard drop — a demoted role can still surface if it scores well otherwise.
  mismatches: [
    {
      id: 'pure-ml-research',
      label: 'pure ML / research role — weaker fit than backend / platform (Ryan drives AI adoption, not modeling)',
      keywords: [
        'machine learning engineer',
        'ml engineer',
        'ml modeler',
        'ml scientist',
        'ml/ai',
        'ai/ml',
        'research scientist',
        'applied scientist',
        'data scientist',
        'deep learning',
        'computer vision',
        'researcher',
        'nlp',
        'modeler',
      ],
      penalty: 30,
    },
    {
      id: 'off-target-role',
      label: 'off-target discipline (mobile / frontend / enterprise-app / QA / sales / security) — not Ryan\'s backend/platform core',
      keywords: [
        // mobile
        'android',
        'ios',
        'mobile engineer',
        'mobile developer',
        'react native',
        // frontend
        'frontend',
        'front-end',
        'front end',
        'ui engineer',
        // enterprise apps / IT
        'salesforce',
        'oracle',
        'sap',
        'netsuite',
        'erp',
        'business systems',
        'finance systems',
        // QA / test
        'qa engineer',
        'sdet',
        'test engineer',
        'quality engineer',
        // sales / support / hardware / security
        'sales engineer',
        'solutions engineer',
        'solutions architect',
        'support engineer',
        'network engineer',
        'hardware engineer',
        'firmware',
        'embedded',
        'security engineer',
      ],
      penalty: 28,
    },
  ],

  // Strategic company preferences (Ryan's guidance), grouped by the *kind* of signal. HCM /
  // group-benefits companies are the highest-signal domain overlap; the big reputable remote orgs
  // are a strong-but-broader tier. Most of these aren't in the curated ATS list — the boost pays off
  // when the Adzuna aggregator surfaces one of their roles.
  preferredCompanies: [
    {
      id: 'top-choice',
      match: ['airbnb'],
      boost: 8,
      reason: 'Top-choice company',
    },
    {
      id: 'hcm-domain-overlap',
      match: [
        'workday',
        'adp',
        'automatic data processing',
        'ukg',
        'ultimate kronos',
        'ceridian',
        'dayforce',
        'paycom',
        'paylocity',
        'prudential',
        'metlife',
        'unum',
        'the hartford',
        'hartford',
      ],
      boost: 8,
      reason: "HCM / group-benefits domain overlap — Ryan's EOI / Absence Management experience translates directly",
    },
    {
      id: 'reputable-remote',
      match: [
        'capital one',
        'stripe',
        'paypal',
        'block',
        'affirm',
        'chewy',
        'shopify',
        'atlassian',
        'servicenow',
        'twilio',
      ],
      boost: 5,
      reason: 'Large, reputable, remote-friendly engineering org with a strong Java / distributed-systems bar',
    },
  ],
};
