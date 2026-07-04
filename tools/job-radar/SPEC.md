# Job Radar — Spec

> Spec-driven build of an agentic job-sourcing + fit-scoring pipeline for Ryan McShane's
> senior software / AI engineering search. Lives inside the portfolio repo as both a working
> tool **and** a public proof of AI-native engineering. Work this task-by-task; no task ships
> with red tests.
>
> This is the repo mirror for review + eventual publishing. Canonical copy lives at
> `~/.claude/plans/job-radar-spec.md` per repo convention; keep the two in sync.

## 1. Purpose & success criteria

**Job (for Ryan):** every morning, produce a ranked, de-duplicated shortlist of open roles that
genuinely fit — senior SWE / AI engineer, remote, at high-quality product companies — each with a
one-paragraph rationale, so Ryan spends application energy only on high-fit roles.

**Job (for the portfolio):** the spec, the pipeline code, and a sanitized live output page are
published as evidence of spec-driven, agentic engineering. "I built an agentic system to run my own
search — here's the spec and the code" is the interview-opening artifact.

**Done when:**
- `npm run radar` produces `data/job-radar/latest.json` locally from real sources.
- A GitHub Action runs it on a schedule and commits the result.
- A `/job-radar` route renders the shortlist, styled to match the site, respecting reduced-motion + AA contrast.
- Every module ships with meaningful unit tests; `npm test`, typecheck, and lint are green.

## 2. Decisions baked in (change any of these if you disagree)

- **Lives in this repo** under `tools/job-radar/` (pipeline) + `src/pages/JobRadar/` (page). Keeps the
  "here's the spec and the code" story in one place and reuses the content model.
- **Language/runtime:** TypeScript, run under Node 20 (matches the repo + the deploy workflow). No new
  runtime deps — the pipeline is plain fetch + code (no SDK, since there's no metered API call).
- **Zero metered-API cost (non-negotiable).** The pipeline never calls the paid Anthropic API. Scoring
  is done two ways, both $0:
  - **Tier 1 — deterministic scorer** (`scoreRules.ts`): rule/keyword/weight matching against the fit
    spec. Free, no key, autonomous (schedulable). Always produces a ranked shortlist.
  - **Tier 2 — Claude Code scorer** (on-command): a `/radar-score` project command has Claude Code read
    the pre-filtered candidates + fit spec + résumé/profile and write nuanced scored output. Runs on
    Ryan's Claude Code **subscription**, not per-token API billing → no added cost. This is where the
    "real AI-native vs. bolt-on" judgment lives.
  - No `@anthropic-ai/sdk`, no `ANTHROPIC_API_KEY`, no `RADAR_MODEL`. (Note: Tier 2 is free only if
    Claude Code is on a Pro/Max subscription rather than API-key billing.)
- **Candidate spec = the existing content model + résumé.** `src/content/impact.ts`, `caseStudies.ts`,
  `skills.ts`, `profile`, plus `tools/job-radar/candidate-resume.md` (markdown mirror of the public
  résumé PDF) compile into the "who Ryan is" half of the prompt. One source of truth.
- **Fit criteria = a versioned spec file** `tools/job-radar/fitSpec.ts` (typed): must-haves,
  nice-to-haves, dealbreakers, weights, comp floor. Values confirmed in §6 (remote-required, $180K floor,
  reputable-only) — the schema and scoring are the engineering; the preferences are personal.
- **Sources (v1):** public ATS board APIs — Greenhouse, Lever, Ashby — for a configured target-company
  list. Plus an **optional aggregator, Adzuna** (`sources/adzuna.ts`): keyword search across many
  employers, enabled only when free-tier credentials (`ADZUNA_APP_ID` / `ADZUNA_APP_KEY`) are present,
  so the no-secrets path is unchanged when they're not. (v2) Hacker News "Who is hiring". No scraping,
  all JSON. Adzuna widens the funnel but not the curated reputability guarantee, so the pre-filter's
  gates (esp. US-only location) and Tier-2 judgment carry more weight on its results.
- **Output is committed to the repo** as JSON and rendered statically. No database, no server.

## 3. Architecture

```
tools/job-radar/
  sources/            one adapter per ATS → normalized Posting[]
    greenhouse.ts
    lever.ts
    ashby.ts
    index.ts          fan out over companies.ts, merge, dedupe
  companies.ts        target list: [{ ats: 'greenhouse'|'lever'|'ashby', token, name }]
  fitSpec.ts   weighted criteria (values confirmed in §6)
  candidateProfile.ts     compiles src/content/* + résumé into the prompt-side profile
  prefilter.ts        deterministic gates (seniority, location, dealbreakers)
  scoreRules.ts       Tier-1 deterministic scorer → FitScore (no LLM, no key)
  pipeline.ts         orchestrate: fetch → prefilter → Tier-1 score → rank → write
  types.ts            Posting, ScoredPosting, FitScore
  run.ts              CLI entry (npm run radar)
.claude/commands/
  radar-score.md      Tier-2: on-command Claude Code scoring pass (subscription, $0)
data/job-radar/
  candidates.json     pre-filtered survivors + Tier-1 scores (Tier-2 reads this)
  latest.json         committed output the page reads
src/pages/JobRadar/   route-level page rendering latest.json
```

**Flow:** `sources` fetch raw postings → normalize to `Posting` → `prefilter` drops obvious misses
(cheap, no LLM) → `scoreRules` (Tier 1) scores survivors deterministically → `pipeline` ranks and writes
`candidates.json` + `latest.json`. Optionally, `/radar-score` (Tier 2) has Claude Code re-score with
nuance and overwrite `latest.json`. No paid API anywhere in the flow.

## 4. Data model (types.ts)

```ts
interface Posting {
  id: string;              // stable hash of source + external id
  source: 'greenhouse' | 'lever' | 'ashby';
  company: string;
  title: string;
  location: string;
  remote: boolean | 'unknown';
  url: string;
  descriptionText: string; // stripped to plain text, capped
  postedAt?: string;
  compHint?: string;       // when the ATS exposes it (Ashby often does)
}

interface FitScore {
  fit: number;             // 0-100
  verdict: 'strong' | 'possible' | 'weak' | 'skip';
  rationale: string;       // 1 short paragraph, grounded in the posting + spec
  matched: string[];       // which must-haves/nice-to-haves it hit
  concerns: string[];      // gaps or dealbreaker-adjacent flags
}

interface ScoredPosting extends Posting { score: FitScore; }
```

## 5. Pipeline stages

1. **Fetch** — each source adapter hits its public board API, maps to `Posting`, strips HTML from
   descriptions, caps length. Network failures are isolated per company (one bad board never fails the run).
2. **Dedupe** — by normalized `(company, title)` and by `url`; keep the freshest.
3. **Pre-filter (deterministic, no LLM)** — `prefilter.ts` applies the fit spec's hard gates in order
   (first failing gate wins the drop reason): `excludeTitles` (too-junior / off-track title, takes
   precedence) → `roleFamily` (title must read as an eng / AI role) → remote (on-site-only dropped;
   hybrid / unknown kept) → **location** (clearly non-US dropped; a US signal keeps it; an unrecognized
   location passes + flagged) → comp floor (a *stated* USD top-of-range below $180K dropped). What we
   can't read, we don't drop on: **unstated / non-USD comp**, **unknown remote**, and an **unrecognized
   location** pass through and are carried as soft `flags` into the rationale. Survivors are `{ posting, flags }`; drops keep a
   machine-readable reason. Keyword matching is whole-word, case-insensitive (shared `matchesKeyword`).
   Cheap; shrinks the set before scoring.
4. **Score — Tier 1 (deterministic, free).** `scoreRules.ts` scores each survivor by rule/keyword/weight
   match against the fit spec, producing a `FitScore` with a transparent breakdown. `pipeline.ts` writes
   `data/job-radar/candidates.json` (survivors + Tier-1 scores, descriptions trimmed for a later read).
5. **Score — Tier 2 (Claude Code, free via subscription, on-command).** The `/radar-score` project
   command has Claude Code read `candidates.json` + fit spec + résumé/profile, apply nuanced judgment,
   and write `data/job-radar/latest.json` with `verdict`, `rationale`, `matched`, `concerns`. Optional —
   if skipped, the Tier-1 output is promoted to `latest.json` so the page always has data.
6. **Rank & write** — sort by `fit` (tie-break freshness), top N plus counts, with a `generatedAt`
   timestamp and which tier produced the scores.

## 6. Fit criteria (confirmed) → `fitSpec.ts`

**Dealbreakers (hard gates, drop the posting):**
- **Not remote-friendly.** Role must be remote OR the company clearly open to remote. On-site-only → drop.
  **Hybrid** roles are *not* dropped — they're carried with `remote: 'hybrid'` and scored as a lesser
  fit (Ryan's call: hybrid is less-than-ideal, not a dealbreaker).
- **US-only location.** Ryan is US-based and only wants US roles. A location that reads as clearly
  non-US → drop; a US / US-remote signal keeps it (and wins over a co-listed non-US region, so
  "Remote — US & Canada" stays); an unrecognized location passes but is flagged to confirm US
  eligibility. `location: { usOnly, usSignals, blockRegions }` in the fit spec.
- **Comp floor: $180K USD.** If a posting states comp and the top of the range is below $180K → drop.
  If comp isn't stated, don't drop on this gate — pass it through and flag "comp unstated" in the rationale.
- **Startups / non-reputable.** Prefer established, reputable companies. The target-company list is
  curated to reputable firms up front, so this is enforced mostly by *which* boards we pull; Tier-2
  scoring also flags anything that reads as early-stage.

**Nice-to-haves (weighted, raise the score):** senior/staff level fit, genuine AI-native engineering
(not LLM-bolt-on), backend/distributed-systems + event-driven match to Ryan's strengths, strong
engineering culture / eng blog, product company.

**Preferred companies (`preferredCompanies` + `preferredBoost`):** Ryan's top-choice companies get a
small additive nudge (not a fit override) so their roles rank higher, all else equal. Currently
**Airbnb** (+8), his top choice among the reachable set.

**Target companies (`companies.ts`):** curated list of reputable companies that expose public
Greenhouse / Lever / Ashby boards. **Probed live 2026-07-02.** Reachable and seeded: Airbnb, Stripe,
Databricks, Dropbox, Pinterest, Block (Greenhouse); Spotify, Plaid (Lever); OpenAI, Notion,
Ramp, Linear, Vercel (Ashby) — Ryan opted to include the well-funded AI-native "borderline" names.
**Excluded by choice:** Coinbase — Ryan does not want to tie his work to crypto.
**Not reachable via these public ATS APIs** (would need a non-ATS v2 source): Netflix (empty Lever
board) and Epic Games (no public board) — two of Ryan's four named targets.

## 7. Publishing (`/job-radar`)

- New route `src/pages/JobRadar/JobRadar.tsx` (+ `.module.css` + `.test.tsx`), reads the committed
  `latest.json` at build time.
- Renders: generated-at, top roles as cards (company, title, fit, rationale, matched/concerns, apply link),
  grouped by verdict. Reuses existing tokens/components; semantic landmarks, keyboard nav, AA contrast,
  reduced-motion.
- **Confidentiality:** this page shows *external* job postings and Ryan's own criteria — no employer
  internals. Still, scan output before first publish; keep the fit spec free of anything proprietary.
- Link `/job-radar` into the nav once it renders. Add a short `/colophon` note describing the pipeline as
  a worked example of the method.

## 8. Deploy / automation (no paid API)

- `.github/workflows/job-radar.yml`: `schedule` (daily cron) + `workflow_dispatch`. Steps: checkout →
  setup Node 20 → `npm ci` → `npm run radar` (free: fetch + pre-filter + **Tier-1** scoring, no secrets)
  → commit `data/job-radar/candidates.json` + `latest.json` if changed. The existing deploy workflow
  publishes the refreshed page on the next push.
- **Tier-2 (Claude Code) scoring is on-command**, run locally by Ryan via `/radar-score` when he wants
  nuanced rationales, then committed. It can't run in CI (no headless subscription there) — and that's
  fine; the autonomous path stays $0 and the page always has Tier-1 data.

## 9. Task list (SDD — implement → test + typecheck + lint → green → next)

1. **Types + fixtures.** `types.ts`; sample raw payloads (one per ATS) as test fixtures.
2. **Source adapters.** `greenhouse.ts`, `lever.ts`, `ashby.ts` + `sources/index.ts` (fan-out, dedupe).
   Unit-test each mapper against its fixture; test dedupe and per-company failure isolation.
3. **Candidate profile compiler.** `candidateProfile.ts` — assemble `src/content/*` + résumé into a stable
   prompt block. Test that it includes impact/skills and stays within a token budget.
4. **Fit spec.** `fitSpec.ts` schema + the confirmed §6 values. Test the shape.
5. **Pre-filter.** ✅ `prefilter.ts` deterministic gates + shared whole-word `matchesKeyword`; each
   gate + edge cases (remote 'unknown', hybrid kept, comp unstated / non-USD, `parseTopUsd`) tested.
   Added `'technical staff'` to `roleFamily` so IC titles like "Member of Technical Staff" (OpenAI et al.)
   aren't wrongly dropped.
6. **Tier-1 scorer.** ✅ `scoreRules.ts` — `baseScore` + matched weighted criteria − `hybridPenalty`,
   clamped 0–100, mapped to a verdict (strong ≥75 / possible ≥55 / weak ≥30 / skip). Pre-filter flags
   flow into `concerns`; missing AI-native is called out. Breakdown, thresholds, hybrid dock, whole-word
   matching, and flag pass-through unit-tested. No API, no key.
7. **Pipeline + CLI + `/radar-score`.** ✅ `pipeline.ts` (pure `assembleReports` + `runPipeline` +
   injectable `writeRadarFiles`), `run.ts`, `npm run radar` via `vite-node` (no new dep). Ranks by fit
   → freshness → title, caps to `DEFAULT_TOP_N` (50), `counts` reflect the full set (incl.
   `byVerdict` + `droppedByReason`), `candidates.json` carries a capped `droppedSample`.
   `.claude/commands/radar-score.md` defines the Tier-2 pass. Orchestration unit-tested (fake fetch,
   mock writer, error isolation). **Verified live 2026-07-02:** 14 boards → 1568 fetched · 548 kept ·
   50 written; `latest.json` 78 KB / `candidates.json` 126 KB. Tier-1 over-credits "AI-native" (keyword
   match anywhere in long descriptions) — the exact bluntness `/radar-score` (Tier-2) is there to fix.
8. **Page.** ✅ `src/pages/JobRadar/` (container `JobRadar` + presentational `JobRadarView`) renders
   the committed `latest.json` via a browser-safe view model in `src/content/jobRadar.ts` (decoupled
   from the Node-only pipeline types). Cards grouped by verdict (skip hidden), fit badge, remote/comp
   meta, matched/concern chips, external apply links, run summary, honest Tier-1 caveat. Lazy route +
   nav link added; SEO via `SeoHead`. Reuses tokens/`Section`/`useReveal` (reduced-motion) with AA
   contrast. Tests: grouping, cards, empty state, tier caveat, jest-axe clean, committed-snapshot
   smoke. `resolveJsonModule` enabled; `npm run build` green (lazy chunk ~12 KB gzip).
9. **Workflow.** ✅ `.github/workflows/job-radar.yml` — daily `cron` + `workflow_dispatch`, Node 20 +
   `npm ci` + `npm run radar` (free, **no secrets**), commits both artifacts only when changed, then
   dispatches `deploy.yml` (a GITHUB_TOKEN push won't auto-trigger it) to republish. Invariants guarded
   by `workflow.test.ts`; YAML validated.
10. **Colophon note.** ✅ Added a `spotlight` to the colophon content model + a labelled callout on
    `/colophon` framing Job Radar as a second, harder worked example of the method, linking to
    `/job-radar`. Confidentiality-safe (public ATS vendors only, no employer internals, no invented
    metrics). Rendering + link + jest-axe covered by `Colophon.test.tsx`.

## 10. Open items to confirm before/while building

- **Fit-spec values** — confirmed (§6): remote-required (hybrid kept but scored lower), $180K floor,
  reputable-only (borderline AI-native names included per Ryan).
- **Target company availability** — ✅ probed live 2026-07-02 (task 2). 14 companies seeded (§6).
  **V2 enhancement:** Netflix (empty Lever board) and Epic Games (no public ATS board) aren't reachable
  via Greenhouse/Lever/Ashby — reaching them needs a non-ATS source, deferred to v2.
- **No API key, no billing.** Design is zero metered-API cost (§2). Ryan confirmed Claude Code is on a
  **Pro subscription**, so Tier-2 scoring is included.
