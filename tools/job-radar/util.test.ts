import { describe, it, expect } from 'vitest';
import {
  capText,
  decodeEntities,
  htmlToText,
  matchedKeywords,
  matchesAnyKeyword,
  matchesKeyword,
  normalizeKey,
  normalizeUrl,
  stableId,
} from './util';

describe('decodeEntities', () => {
  it('decodes named, decimal, and hex entities', () => {
    expect(decodeEntities('a &amp; b')).toBe('a & b');
    expect(decodeEntities('&lt;p&gt;')).toBe('<p>');
    expect(decodeEntities('&#39;quote&#39;')).toBe("'quote'");
    expect(decodeEntities('&#x2764;')).toBe('❤');
  });

  it('leaves unknown entities untouched', () => {
    expect(decodeEntities('&notreal; text')).toBe('&notreal; text');
  });
});

describe('htmlToText', () => {
  it('decodes entity-encoded markup then strips tags (Greenhouse case)', () => {
    const raw =
      '&lt;div&gt;&lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;&lt;/div&gt;';
    expect(htmlToText(raw)).toBe('Hello world');
  });

  it('turns block elements into line breaks and drops script/style', () => {
    const raw = '<p>One</p><style>.x{}</style><p>Two</p>';
    expect(htmlToText(raw)).toBe('One\nTwo');
  });

  it('passes plain text through unchanged', () => {
    expect(htmlToText('Just plain text.')).toBe('Just plain text.');
  });

  it('collapses runs of whitespace', () => {
    expect(htmlToText('a    b\t\tc')).toBe('a b c');
  });
});

describe('capText', () => {
  it('returns short text unchanged', () => {
    expect(capText('short', 100)).toBe('short');
  });

  it('caps on a word boundary and appends an ellipsis', () => {
    const out = capText('one two three four five', 12);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(13);
    expect(out).not.toContain('  ');
  });
});

describe('stableId', () => {
  it('is deterministic for identical inputs', () => {
    expect(stableId('greenhouse', 123)).toBe(stableId('greenhouse', 123));
  });

  it('differs across sources and ids', () => {
    expect(stableId('greenhouse', 123)).not.toBe(stableId('lever', 123));
    expect(stableId('greenhouse', 123)).not.toBe(stableId('greenhouse', 124));
  });

  it('produces an 8-char hex string', () => {
    expect(stableId('ashby', 'abc')).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('normalizeKey / normalizeUrl', () => {
  it('normalizeKey lowercases and collapses whitespace', () => {
    expect(normalizeKey('  Senior   Software  Engineer ')).toBe('senior software engineer');
  });

  it('normalizeUrl drops query, hash, and trailing slash', () => {
    expect(normalizeUrl('https://Jobs.Example.com/roles/1/?utm=x#top')).toBe(
      'https://jobs.example.com/roles/1',
    );
  });
});

describe('matchesKeyword (whole-word, case-insensitive)', () => {
  it('matches a token regardless of case', () => {
    expect(matchesKeyword('Senior AI Engineer', 'ai')).toBe(true);
    expect(matchesKeyword('senior ai engineer', 'AI')).toBe(true);
  });

  it('does not match a short keyword buried in a larger word', () => {
    expect(matchesKeyword('Send me an email', 'ai')).toBe(false);
    expect(matchesKeyword('Render the html', 'ml')).toBe(false);
    expect(matchesKeyword('Team Leader', 'lead')).toBe(false);
    expect(matchesKeyword('Software Engineering', 'engineer')).toBe(false);
  });

  it('matches multi-word and punctuated keywords verbatim', () => {
    expect(matchesKeyword('Staff Machine Learning Engineer', 'machine learning')).toBe(true);
    expect(matchesKeyword('Member of Technical Staff', 'technical staff')).toBe(true);
    expect(matchesKeyword('Jr. Developer', 'jr.')).toBe(true);
    expect(matchesKeyword('Backend / event-driven systems', 'event-driven')).toBe(true);
  });

  it('returns false for an empty or whitespace keyword', () => {
    expect(matchesKeyword('anything', '')).toBe(false);
    expect(matchesKeyword('anything', '   ')).toBe(false);
  });
});

describe('matchesAnyKeyword / matchedKeywords', () => {
  it('matchesAnyKeyword is true when at least one keyword hits', () => {
    expect(matchesAnyKeyword('Staff Backend Engineer', ['designer', 'engineer'])).toBe(true);
    expect(matchesAnyKeyword('Product Designer', ['engineer', 'developer'])).toBe(false);
  });

  it('matchedKeywords returns exactly the terms that hit', () => {
    expect(matchedKeywords('Senior Staff AI Engineer', ['senior', 'staff', 'intern'])).toEqual([
      'senior',
      'staff',
    ]);
  });
});
