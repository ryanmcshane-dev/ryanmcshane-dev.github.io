import { describe, it, expect } from 'vitest';
import {
  assembleReports,
  rankScored,
  runPipeline,
  writeRadarFiles,
  type CandidatesFile,
  type RadarReport,
  type RadarWriter,
} from './pipeline';
import { scoreFit } from './scoreRules';
import type { CompanyConfig, FetchLike, FetchResponseLike, Posting, ScoredPosting } from './types';
import { greenhouseFixture } from './sources/__fixtures__/greenhouse.fixture';

const NOW = new Date('2026-07-02T12:00:00.000Z');

function makePosting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    source: overrides.source ?? 'greenhouse',
    company: overrides.company ?? 'Acme',
    title: overrides.title ?? 'Senior Software Engineer',
    location: overrides.location ?? 'Remote',
    remote: overrides.remote ?? true,
    url: overrides.url ?? `https://example.com/jobs/${overrides.id ?? 'x'}`,
    descriptionText: overrides.descriptionText ?? '',
    postedAt: overrides.postedAt,
    compHint: overrides.compHint ?? '$200,000',
  };
}

function makeScored(id: string, fit: number, postedAt?: string): ScoredPosting {
  return {
    ...makePosting({ id, title: `Role ${id}`, postedAt }),
    score: { fit, verdict: 'possible', rationale: '', matched: [], concerns: [] },
  };
}

describe('rankScored', () => {
  it('orders by fit desc, then freshness desc, then title asc', () => {
    const ranked = rankScored([
      makeScored('a', 60, '2026-01-01T00:00:00Z'),
      makeScored('c', 80, '2026-01-01T00:00:00Z'),
      makeScored('b', 80, '2026-06-01T00:00:00Z'), // same fit as c but fresher
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate its input', () => {
    const input = [makeScored('a', 10), makeScored('b', 90)];
    const before = input.map((r) => r.id);
    rankScored(input);
    expect(input.map((r) => r.id)).toEqual(before);
  });
});

describe('assembleReports', () => {
  const source = {
    postings: [
      makePosting({
        id: 'strong',
        title: 'Staff AI Engineer',
        descriptionText: 'LLM agents on a distributed backend with Kafka, AWS, and deep observability.',
      }),
      makePosting({ id: 'weak', title: 'Software Engineer', descriptionText: '' }),
      makePosting({ id: 'onsite', title: 'Backend Engineer', remote: false }),
      makePosting({ id: 'mgr', title: 'Engineering Manager' }),
    ],
    errors: [{ company: 'BadCo', ats: 'lever' as const, message: 'HTTP 500' }],
  };

  it('counts fetched / kept / dropped and buckets verdicts', () => {
    const { report } = assembleReports(source, { now: NOW });
    expect(report.counts.fetched).toBe(4);
    expect(report.counts.kept).toBe(2);
    expect(report.counts.dropped).toBe(2);
    expect(report.counts.byVerdict).toEqual({ strong: 1, possible: 0, weak: 1, skip: 0 });
  });

  it('ranks survivors best-fit first and stamps a deterministic generatedAt + tier', () => {
    const { report } = assembleReports(source, { now: NOW });
    expect(report.generatedAt).toBe('2026-07-02T12:00:00.000Z');
    expect(report.tier).toBe('tier-1');
    expect(report.items.map((i) => i.id)).toEqual(['strong', 'weak']);
    expect(report.items[0].score.verdict).toBe('strong');
  });

  it('passes source errors through untouched', () => {
    const { report, candidates } = assembleReports(source, { now: NOW });
    expect(report.errors).toEqual(source.errors);
    expect(candidates.errors).toEqual(source.errors);
  });

  it('summarizes drops by reason and keeps a capped sample for spot-checking', () => {
    const { report, candidates } = assembleReports(source, { now: NOW });
    expect(report.counts.droppedByReason).toEqual({
      'excluded-title': 1,
      'off-role-family': 0,
      'on-site-only': 1,
      'non-us-location': 0,
      'below-comp-floor': 0,
    });
    const reasons = candidates.droppedSample.map((d) => d.reason).sort();
    expect(reasons).toEqual(['excluded-title', 'on-site-only']);
    expect(candidates.droppedSample.every((d) => d.title && d.detail)).toBe(true);
  });

  it('caps the artifacts at top N while counts reflect the full survivor set', () => {
    const postings = Array.from({ length: 5 }, (_, i) =>
      makePosting({ id: `r${i}`, title: `Senior Backend Engineer ${i}`, url: `https://example.com/${i}` }),
    );
    const { report, candidates } = assembleReports({ postings, errors: [] }, { now: NOW, topN: 2 });
    expect(report.counts.kept).toBe(5); // full set
    expect(report.items).toHaveLength(2); // shortlist
    expect(candidates.candidates).toHaveLength(2);
  });

  it('trims descriptions harder for the page than for the Tier-2 read', () => {
    const longDesc = 'lorem ipsum '.repeat(400); // ~4800 chars
    const { report, candidates } = assembleReports(
      { postings: [makePosting({ id: 'x', descriptionText: longDesc })], errors: [] },
      { now: NOW },
    );
    const pageDesc = report.items[0].descriptionText;
    const tier2Desc = candidates.candidates[0].descriptionText;
    expect(pageDesc.length).toBeLessThan(tier2Desc.length);
    expect(pageDesc.endsWith('…')).toBe(true);
    expect(tier2Desc.endsWith('…')).toBe(true);
    expect(pageDesc.length).toBeLessThanOrEqual(601);
  });
});

describe('writeRadarFiles', () => {
  function mockWriter() {
    const mkdirs: string[] = [];
    const files: Array<{ path: string; contents: string }> = [];
    const writer: RadarWriter = {
      mkdir: (dir) => void mkdirs.push(dir),
      writeFile: (path, contents) => void files.push({ path, contents }),
    };
    return { writer, mkdirs, files };
  }

  const report: RadarReport = {
    generatedAt: NOW.toISOString(),
    tier: 'tier-1',
    counts: {
      fetched: 0,
      kept: 0,
      dropped: 0,
      byVerdict: { strong: 0, possible: 0, weak: 0, skip: 0 },
      droppedByReason: {
        'excluded-title': 0,
        'off-role-family': 0,
        'on-site-only': 0,
        'non-us-location': 0,
        'below-comp-floor': 0,
      },
    },
    errors: [],
    items: [],
  };
  const candidates: CandidatesFile = { ...report, tier: 'tier-1', candidates: [], droppedSample: [] };

  it('creates the dir and writes both artifacts as parseable JSON with a trailing newline', () => {
    const { writer, mkdirs, files } = mockWriter();
    writeRadarFiles(report, candidates, writer, 'out-dir');

    expect(mkdirs).toEqual(['out-dir']);
    expect(files).toHaveLength(2);
    const byName = (suffix: string) => files.find((f) => f.path.endsWith(suffix))!;
    for (const suffix of ['candidates.json', 'latest.json']) {
      const file = byName(suffix);
      expect(file).toBeDefined();
      expect(file.contents.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(file.contents)).not.toThrow();
    }
    expect(JSON.parse(byName('latest.json').contents).tier).toBe('tier-1');
  });
});

describe('runPipeline (fetch wired in)', () => {
  const company: CompanyConfig = { name: 'Test', ats: 'greenhouse', token: 'test' };
  const ok = (body: unknown): FetchResponseLike => ({ ok: true, status: 200, json: async () => body });

  it('fetches, filters, scores, and ranks from a board payload', async () => {
    const fetchImpl: FetchLike = async () => ok(greenhouseFixture);
    const { report, candidates } = await runPipeline([company], { fetchImpl, now: () => NOW });

    // Fixture: one Senior SWE (remote) survives; one "Acquisition Manager" is dropped (excluded title).
    expect(report.counts.fetched).toBe(2);
    expect(report.counts.kept).toBe(1);
    expect(report.items[0].title).toContain('Senior Software Engineer');
    expect(candidates.droppedSample[0].reason).toBe('excluded-title');
  });

  it('isolates a failing board — errors captured, run still completes', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('network down');
    };
    const { report } = await runPipeline([company], { fetchImpl, now: () => NOW });
    expect(report.counts.fetched).toBe(0);
    expect(report.items).toEqual([]);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].company).toBe('Test');
  });
});

describe('scoreFit sanity (pipeline uses it)', () => {
  it('scores the fixture Senior SWE as possible (senior + backend, no AI signal)', () => {
    const [seniorSwe] = greenhouseFixture.jobs;
    const posting = makePosting({
      title: seniorSwe.title,
      descriptionText: 'event-driven backend services on AWS',
      remote: true,
    });
    const score = scoreFit({ posting, flags: [] });
    expect(score.verdict).toBe('possible');
    expect(score.concerns).toContain('no AI-native engineering signal');
  });
});
