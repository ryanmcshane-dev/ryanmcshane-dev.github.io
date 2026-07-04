import { describe, it, expect } from 'vitest';
import { classifyLocation, parseTopUsd, prefilter } from './prefilter';
import type { DropReason } from './prefilter';
import { fitSpec } from './fitSpec';
import type { Posting, Remote } from './types';

/** Build a Posting with sensible defaults; override only what a case cares about. */
function makePosting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: overrides.id ?? 'id-1',
    source: overrides.source ?? 'greenhouse',
    company: overrides.company ?? 'Acme',
    title: overrides.title ?? 'Senior Software Engineer',
    location: overrides.location ?? 'Remote - US',
    remote: overrides.remote ?? true,
    url: overrides.url ?? 'https://example.com/jobs/1',
    descriptionText: overrides.descriptionText ?? 'Build things.',
    postedAt: overrides.postedAt,
    compHint: overrides.compHint,
  };
}

/** Reason a single posting was dropped, or undefined if it survived. */
function dropReasonFor(posting: Posting): DropReason | undefined {
  return prefilter([posting]).dropped[0]?.reason;
}

/** Flags on a single surviving posting (empty array if it survived with none). */
function flagsFor(posting: Posting): string[] | undefined {
  return prefilter([posting]).kept[0]?.flags;
}

describe('prefilter — excluded-title gate (takes precedence)', () => {
  it.each([
    'Software Engineering Intern',
    'Junior Backend Developer',
    'Engineering Manager',
    'Director of Engineering',
    'Product Designer',
    'Sales Engineer',
    'Data Analyst',
  ])('drops %s', (title) => {
    expect(dropReasonFor(makePosting({ title }))).toBe('excluded-title');
  });

  it('excluded title wins even when the title also matches the role family', () => {
    // "Software Engineering Intern" matches role-family ('software') AND exclude ('intern').
    const { dropped } = prefilter([makePosting({ title: 'Software Engineering Intern' })]);
    expect(dropped[0].reason).toBe('excluded-title');
    expect(dropped[0].detail).toContain('intern');
  });
});

describe('prefilter — role-family gate', () => {
  it.each([
    'Senior Software Engineer',
    'Staff Backend Engineer',
    'Principal Platform Engineer',
    'Machine Learning Engineer',
    'Distributed Systems Engineer',
    'Member of Technical Staff',
    'Solutions Architect',
  ])('keeps engineering role %s', (title) => {
    expect(dropReasonFor(makePosting({ title }))).toBeUndefined();
  });

  it.each(['Account Executive', 'Customer Success Lead', 'Chief of Staff'])(
    'drops off-family role %s',
    (title) => {
      expect(dropReasonFor(makePosting({ title }))).toBe('off-role-family');
    },
  );
});

describe('prefilter — remote gate', () => {
  it('drops on-site-only (remote === false)', () => {
    expect(dropReasonFor(makePosting({ remote: false }))).toBe('on-site-only');
  });

  // Give each a floor-clearing comp so the only flags under test are the remote ones.
  it.each<[Remote, string[]]>([
    [true, []],
    ['hybrid', ['hybrid (partial remote)']],
    ['unknown', ['remote unstated']],
  ])('keeps remote=%s with the right flags', (remote, expectedFlags) => {
    expect(flagsFor(makePosting({ remote, compHint: '$200,000' }))).toEqual(expectedFlags);
  });
});

describe('prefilter — US-location gate', () => {
  it.each([
    'Remote - USA',
    'Remote - US',
    'Remote-US',
    'Remote - United States',
    'United States',
    'New York, NY (HQ)',
    'San Francisco',
    'Austin, TX',
    'Remote (North America)',
  ])('keeps US / US-remote location %s', (location) => {
    expect(dropReasonFor(makePosting({ location }))).toBeUndefined();
  });

  it.each([
    'Brazil',
    'Remote - Brazil',
    'Remote - Bangalore, India',
    'Bangalore, India',
    'London, United Kingdom',
    'Toronto, Canada',
    'Remote - EMEA',
  ])('drops clearly non-US location %s', (location) => {
    expect(dropReasonFor(makePosting({ location }))).toBe('non-us-location');
  });

  it('lets a US signal win over a co-listed non-US region (Remote - US & Canada)', () => {
    expect(dropReasonFor(makePosting({ location: 'Remote - US & Canada' }))).toBeUndefined();
  });

  it('flags — never drops — an unrecognized / bare-remote location', () => {
    expect(flagsFor(makePosting({ location: 'Remote', compHint: '$200,000' }))).toEqual([
      'location "Remote" — confirm US eligibility',
    ]);
  });

  it('does not read a substring as a US signal (Belarus is not "US")', () => {
    // "us" is whole-word matched, so it must not fire inside "Belarus" — it reads as ambiguous, not US.
    expect(classifyLocation('Minsk, Belarus', fitSpec.location)).toBe('ambiguous');
  });
});

describe('classifyLocation', () => {
  const loc = fitSpec.location;

  it.each(['Remote - US', 'United States', 'San Francisco', 'Remote (North America)'])(
    'reads %s as US',
    (location) => {
      expect(classifyLocation(location, loc)).toBe('us');
    },
  );

  it.each(['Brazil', 'Bangalore, India', 'London, United Kingdom', 'Remote - EMEA'])(
    'reads %s as non-us',
    (location) => {
      expect(classifyLocation(location, loc)).toBe('non-us');
    },
  );

  it.each(['Remote', 'Anywhere', ''])('reads %s as ambiguous', (location) => {
    expect(classifyLocation(location, loc)).toBe('ambiguous');
  });

  it('lets a US signal take precedence over a co-listed non-US region', () => {
    expect(classifyLocation('Remote - US & Canada', loc)).toBe('us');
  });
});

describe('prefilter — comp-floor gate', () => {
  it('drops a stated USD range whose top is below the $180K floor', () => {
    expect(dropReasonFor(makePosting({ compHint: '$150,000 - $170,000' }))).toBe('below-comp-floor');
  });

  it('keeps a stated range whose top clears the floor', () => {
    expect(dropReasonFor(makePosting({ compHint: '$200K – $250K' }))).toBeUndefined();
  });

  it('keeps a role at exactly the floor', () => {
    expect(dropReasonFor(makePosting({ compHint: '$180,000' }))).toBeUndefined();
  });

  it('flags — never drops — a posting with no stated comp', () => {
    expect(flagsFor(makePosting({ compHint: undefined }))).toEqual(['comp unstated']);
  });

  it('flags — never drops — non-USD comp we cannot verify against a USD floor', () => {
    expect(flagsFor(makePosting({ compHint: '£90,000 – £110,000' }))).toEqual([
      'comp not USD-verifiable',
    ]);
  });
});

describe('prefilter — result shape and multiple flags', () => {
  it('partitions a batch into kept and dropped', () => {
    const { kept, dropped } = prefilter([
      makePosting({ id: 'a', title: 'Senior Software Engineer', remote: true }),
      makePosting({ id: 'b', title: 'Marketing Manager' }),
      makePosting({ id: 'c', title: 'Backend Engineer', remote: false }),
    ]);
    expect(kept.map((k) => k.posting.id)).toEqual(['a']);
    expect(dropped.map((d) => d.reason)).toEqual(['excluded-title', 'on-site-only']);
  });

  it('accumulates multiple flags on one survivor (hybrid + comp unstated)', () => {
    expect(flagsFor(makePosting({ remote: 'hybrid', compHint: undefined }))).toEqual([
      'comp unstated',
      'hybrid (partial remote)',
    ]);
  });
});

describe('parseTopUsd', () => {
  it('returns null for empty / missing input', () => {
    expect(parseTopUsd(undefined)).toBeNull();
    expect(parseTopUsd('')).toBeNull();
    expect(parseTopUsd('Competitive salary and equity')).toBeNull();
  });

  it('takes the top of a dollar range', () => {
    expect(parseTopUsd('$180,000 - $220,000')).toBe(220000);
  });

  it('expands K and M suffixes', () => {
    expect(parseTopUsd('$180K – $250K')).toBe(250000);
    expect(parseTopUsd('$1.2M package')).toBe(1200000);
  });

  it('reads comma-grouped and USD-suffixed amounts without a dollar sign', () => {
    expect(parseTopUsd('Base 210,000 plus bonus')).toBe(210000);
    expect(parseTopUsd('200000 USD base')).toBe(200000);
  });

  it('ignores a bare 401k retirement reference', () => {
    expect(parseTopUsd('Great benefits including 401k matching')).toBeNull();
  });

  it('ignores implausibly small amounts (e.g. an hourly rate)', () => {
    expect(parseTopUsd('$85/hour')).toBeNull();
  });

  it('returns null for clearly non-USD currency', () => {
    expect(parseTopUsd('€120,000')).toBeNull();
    expect(parseTopUsd('CA$200,000')).toBeNull();
    expect(parseTopUsd('150,000 GBP')).toBeNull();
  });
});
