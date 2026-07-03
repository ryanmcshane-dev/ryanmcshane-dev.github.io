/**
 * Candidate profile compiler.
 *
 * Assembles the "who Ryan is" half of the scoring prompt from a single source of truth: the
 * site's typed content model (`src/content/*` + `config`) plus the résumé markdown mirror. The
 * output is one stable, compact markdown block that both the Tier-1 deterministic scorer (as a
 * keyword corpus) and the Tier-2 Claude Code pass (as readable context) consume.
 *
 * `buildCandidateProfile` is pure (content in → string out) so it unit-tests without touching the
 * filesystem; `loadResume` / `getCandidateProfile` add the thin disk read.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { about } from '@/content/about';
import { aiNative } from '@/content/aiNative';
import { impact } from '@/content/impact';
import { skillGroups } from '@/content/skills';
import { flagshipCaseStudy } from '@/content/caseStudies';
import { siteConfig } from '@/config';

/** Rough token estimate (~4 chars/token). Heuristic — no tokenizer dependency. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Guardrail: the compiled profile must stay under this. It bounds the scoring context so the
 * profile can't grow without notice — not a tight squeeze, a tripwire.
 */
export const PROFILE_TOKEN_BUDGET = 3000;

/** Compile the content model + a résumé markdown string into one stable profile block. */
export function buildCandidateProfile(resumeMarkdown: string): string {
  const snapshot = about.facts.map((f) => `- ${f.label}: ${f.value}`).join('\n');
  const skills = skillGroups.map((g) => `- ${g.title}: ${g.skills.join(', ')}`).join('\n');
  const pillars = aiNative.pillars.map((p) => `- ${p.title} — ${p.tagline}`).join('\n');
  const highlights = impact
    .map((c) => `- ${c.metric} ${c.unit} — ${c.title}: ${c.description}`)
    .join('\n');

  return [
    `# Candidate Profile — ${siteConfig.name}`,
    '',
    siteConfig.role,
    siteConfig.tagline,
    '',
    '## Snapshot',
    snapshot,
    '',
    '## Core skills',
    skills,
    '',
    '## AI-native engineering',
    aiNative.statement,
    pillars,
    `Toolkit: ${aiNative.toolkit.join(', ')}`,
    '',
    '## Impact highlights',
    highlights,
    '',
    '## Flagship case study',
    flagshipCaseStudy.title,
    flagshipCaseStudy.summary,
    '',
    '## Résumé',
    resumeMarkdown.trim(),
    '',
  ].join('\n');
}

/**
 * Path to the résumé markdown mirror, resolved from the repo root (both `npm test` and the
 * `npm run radar` CLI run with the repo root as cwd).
 */
export const RESUME_PATH = resolve(process.cwd(), 'tools/job-radar/candidate-resume.md');

/** Read the résumé markdown mirror from disk. `readFile` is injectable for tests. */
export function loadResume(readFile: (path: string) => string = (p) => readFileSync(p, 'utf8')): string {
  return readFile(RESUME_PATH);
}

/** Compile the full candidate profile (content modules + résumé on disk) into one prompt block. */
export function getCandidateProfile(): string {
  return buildCandidateProfile(loadResume());
}
