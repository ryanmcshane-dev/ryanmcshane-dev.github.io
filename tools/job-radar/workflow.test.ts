import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Guards the scheduled workflow's invariants (SPEC.md §8): it must run on a schedule *and* be
 * manually dispatchable, run the free Tier-1 CLI, commit both artifacts, and carry **no secrets**
 * (the autonomous path is zero-cost, zero-key). A static-text guard — no YAML dep needed.
 */
const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/job-radar.yml'),
  'utf8',
);

describe('job-radar workflow', () => {
  it('runs on a daily schedule and is manually dispatchable', () => {
    expect(workflow).toMatch(/schedule:/);
    expect(workflow).toMatch(/cron:\s*'[^']+'/);
    expect(workflow).toMatch(/workflow_dispatch:/);
  });

  it('installs deterministically and runs on Node 20 (matches deploy)', () => {
    expect(workflow).toMatch(/node-version:\s*20/);
    expect(workflow).toMatch(/npm ci/);
  });

  it('runs the free Tier-1 pipeline CLI', () => {
    expect(workflow).toMatch(/npm run radar/);
  });

  it('commits both committed artifacts back to the repo', () => {
    expect(workflow).toContain('data/job-radar/latest.json');
    expect(workflow).toContain('data/job-radar/candidates.json');
    expect(workflow).toMatch(/git commit/);
    expect(workflow).toMatch(/git push/);
  });

  it('only commits when the data actually changed', () => {
    expect(workflow).toMatch(/git diff --staged --quiet/);
  });

  it('carries no paid-API secrets — the pipeline never calls a metered API', () => {
    expect(workflow).not.toMatch(/ANTHROPIC_API_KEY/);
    expect(workflow).not.toMatch(/OPENAI_API_KEY/);
  });

  it('references only the optional free-tier Adzuna credentials (and stays runnable without them)', () => {
    const secretRefs = workflow.match(/secrets\.\w+/g) ?? [];
    for (const ref of secretRefs) {
      expect(ref).toMatch(/secrets\.ADZUNA_APP_(ID|KEY)/);
    }
  });

  it('has write permissions to push data and dispatch the deploy', () => {
    expect(workflow).toMatch(/contents:\s*write/);
    expect(workflow).toMatch(/actions:\s*write/);
  });
});
