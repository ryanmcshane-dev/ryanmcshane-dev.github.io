---
name: resume-fine-tuning
description: >-
  Tailor Ryan McShane's resume to a specific job posting to maximize interview chances.
  Trigger when the user shares a job posting URL (or pasted job description) and wants a
  fine-tuned / tailored / job-specific resume. Pulls only from the master experience file —
  never fabricates. Surfaces posting requirements not yet documented and asks the user to
  confirm them before writing anything new.
---

# Resume fine-tuning

Produce a resume tailored to one job posting, drawing **only** from documented, true facts.
The goal is to maximize the chance of landing an interview — by surfacing and foregrounding
real experience that matches the role, mirroring the posting's language where it's honestly
true, and never inventing anything.

## Source of truth

- **Master file:** `tools/resume-tailor/skills_and_experience.md` — the ONLY place tailored
  resumes may draw facts from. If something isn't in there, it can't go on the resume until
  the user confirms it's true and it's been written back into the master file.
- **Current baseline resume:** `tools/job-radar/candidate-resume.pdf`.
- **Portfolio content** (`src/content/*.ts`) is upstream of the master file; if it has newer
  facts than the master file, reconcile into the master file first.

## Non-negotiables

1. **Never fabricate.** No invented metrics, titles, dates, tools, or responsibilities. Every
   line must be traceable to the master file.
2. **Honor confidentiality** (see the guardrails section of the master file): don't name the
   external HCM partner platform, the internal AI agent / internal project names, or the HCM
   vendor customer (use "a major HCM vendor").
3. **Gaps are surfaced, not filled.** If the posting wants X and X isn't in the master file,
   ask the user — don't quietly stretch an adjacent fact into a claim.

## Procedure

### 1. Capture the posting
Fetch the URL (or take pasted text). Save a verbatim capture to
`tools/resume-tailor/applications/<company>-<role-slug>/job-posting.md`. Extract and separate:
- **Responsibilities** ("You will").
- **Hard requirements** ("You have" / "Requirements" / "Qualifications").
- **Preferred / nice-to-have** (if a separate section exists).
- **Tech stack** — and note the framing. "Technologies we use **and teach**" / "nice to have"
  signals *exposure*, not a gate; treat those gaps as softer than hard-requirement gaps.
- Team mission / product description (for tone and language mirroring).

### 2. Map requirements → evidence
Build a fit table: each requirement + tech item → the specific master-file bullet/skill that
evidences it, or mark it a GAP. Grade each as ✅ strong / 🟡 partial-or-adjacent / ❌ missing.

### 3. Surface gaps and ask (STOP here)
Present to the user, grouped:
- **Strengths** — where the fit is strong (brief; keeps it honest and motivating).
- **Hard-requirement gaps** — missing items from the required list. Highest priority.
- **Stack / preferred gaps** — missing "we use and teach" or nice-to-have items.

For each gap, ask plainly: *"Do you have real experience with this? If so, what specifically?"*
Also flag any adjacency worth a truthful reframe (e.g., Java ↔ Kotlin, IBM MQ/event-driven ↔
Kafka, PostgreSQL ↔ AWS Aurora) so the user can confirm whether the bridge is fair to claim.

**Do not generate the resume yet.** Wait for the user's answers.

### 4. Record confirmed facts
For every gap the user confirms as true, append it to the master file (skills list and/or the
"Confirmed extras" section) with a one-line note on the actual experience, so it compounds for
future runs. Discard anything the user says they don't have — never carry it forward.

### 5. Generate the tailored resume
Only after confirmation. In `tools/resume-tailor/applications/<company>-<role-slug>/`:
- Write `resume.md` (default format unless the user asked otherwise).
- Tailor by: reordering/emphasizing real bullets toward the role; rewriting the summary to lead
  with the role's priorities (using only true facts); mirroring the posting's vocabulary where
  it honestly applies; surfacing newly-confirmed skills into the skills block.
- Keep the baseline's structure and ~2-page length unless the user requests otherwise.
- Write a short `gap-analysis.md` recording the fit table and what was/wasn't added, so the
  tailoring decisions are auditable later.

### 6. Offer next steps
Note anything the user could truthfully strengthen (a cert, a side project, phrasing to verify),
and offer a matching cover-letter / "why this company" blurb if useful.

## Iteration
The user reviews and responds; regenerate `resume.md` from their feedback. Each new posting is a
new `applications/<company>-<role-slug>/` folder. The master file is the durable asset — keep it
accurate and it makes every future tailoring pass faster and safer.
