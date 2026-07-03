---
description: Tier-2 Job Radar scoring — re-score the pre-filtered candidates with nuanced judgment ($0, subscription).
---

# /radar-score — Tier-2 Job Radar scoring pass

You are the **Tier-2 scorer** for Job Radar (see `tools/job-radar/SPEC.md`). The autonomous pipeline
has already fetched, pre-filtered, and Tier-1–scored today's postings. Your job is to apply the
**nuanced judgment a keyword scorer can't** — especially *genuine AI-native engineering vs. LLM
bolt-on* — and write the final ranked shortlist.

This runs on Ryan's Claude Code **subscription**, so it costs **$0** — no paid API, no key. Do not
add or call any Anthropic SDK.

## Inputs (read these first)

1. `data/job-radar/candidates.json` — the pre-filtered survivors with Tier-1 scores, a
   `droppedByReason` summary (in `counts`), and a small `droppedSample`. **This is your work set.**
2. `tools/job-radar/fitSpec.ts` — Ryan's fit criteria: `$180K` comp floor, remote-required (hybrid
   is a lesser fit, not a dealbreaker), the role-family / exclude gates, and the weighted signals.
3. The candidate profile — run `getCandidateProfile()` from `tools/job-radar/candidateProfile.ts`
   (or read `tools/job-radar/candidate-resume.md` + `src/content/*`) for who Ryan is: senior
   software / AI engineer, event-driven backend platforms, spec-driven + agentic engineering.

## What to judge (per candidate)

Go beyond keyword hits. For each candidate weigh:

- **Genuine AI-native engineering** — is AI *core* to the role (building agents, LLM systems, RAG,
  ML platforms) or a bolt-on buzzword? This is Ryan's headline differentiator; reward the real thing
  and discount the decorative.
- **Seniority fit** — senior / staff / principal / lead IC (or an eng title like "Member of
  Technical Staff"). Flag anything that reads junior or purely managerial.
- **Backend / distributed-systems + event-driven** match to Ryan's strengths (Java/Spring, Kafka,
  streaming, AWS, microservices).
- **Remote & comp** — respect the hard gates. Hybrid stays but scores lower. If comp is unstated or
  the posting carries a `comp unstated` / `comp not USD-verifiable` flag, keep it and say so in the
  rationale — never invent a number.
- **Company quality** — established, reputable, strong engineering culture. Flag anything that reads
  early-stage or low-signal.

## Output — overwrite `data/job-radar/latest.json`

Write the **same `RadarReport` shape** the pipeline emits (see `pipeline.ts`), with:

- `generatedAt` — now (ISO 8601).
- `tier` — `"tier-2"`.
- `counts` — recompute `byVerdict` from your verdicts; keep `fetched` / `kept` / `dropped` from
  `candidates.json`.
- `errors` — carry over from `candidates.json`.
- `items` — every candidate, **ranked by your `fit` (desc)**, each with an updated `score`:
  - `fit` (0–100), `verdict` (`strong` ≥75 / `possible` ≥55 / `weak` ≥30 / `skip`),
  - `rationale` — one tight, honest paragraph grounded in *this* posting and the fit spec,
  - `matched` — the real strengths, `concerns` — gaps, hybrid/comp flags, bolt-on-AI suspicions.

Keep each posting's existing fields (`id`, `company`, `title`, `url`, `location`, `remote`,
`descriptionText`, `postedAt`, `compHint`) intact.

## Guardrails

- **$0 only** — subscription pass, no paid API / SDK / key.
- **Never invent metrics or comp.** If it isn't stated, say it isn't.
- **Confidentiality** — this data is *external* postings + Ryan's own criteria; keep it that way. No
  employer internals leak into the file.
- After writing, print a short summary: counts by verdict and the top 3 roles.
