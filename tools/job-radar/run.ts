/**
 * Job Radar CLI — `npm run radar` (SPEC.md §5, §8).
 *
 * The free, autonomous path: fetch every configured board → pre-filter → Tier-1 score → rank →
 * write `data/job-radar/latest.json` + `candidates.json`. No secrets, no paid API — safe to run in
 * CI on a schedule. Tier-2 (`/radar-score`) is a separate, on-command Claude Code pass.
 *
 * Run via `vite-node` (bundled with vitest) so no TS-runner dependency is added.
 */
import { companies } from './companies';
import { runPipeline, writeRadarFiles } from './pipeline';

async function main(): Promise<void> {
  const { report, candidates } = await runPipeline(companies);
  writeRadarFiles(report, candidates);

  const { fetched, kept, dropped, byVerdict } = report.counts;
  console.log(
    `Job Radar — ${companies.length} companies · ${fetched} fetched · ${kept} kept · ${dropped} dropped`,
  );
  console.log(
    `Verdicts — strong ${byVerdict.strong} · possible ${byVerdict.possible} · weak ${byVerdict.weak} · skip ${byVerdict.skip}`,
  );
  if (report.errors.length > 0) {
    console.warn(`Source errors (${report.errors.length}): ${report.errors.map((e) => `${e.company} (${e.message})`).join('; ')}`);
  }
  console.log(`Wrote data/job-radar/latest.json (${report.items.length} items) + candidates.json`);
}

main().catch((err) => {
  console.error('Job Radar run failed:', err);
  process.exit(1);
});
