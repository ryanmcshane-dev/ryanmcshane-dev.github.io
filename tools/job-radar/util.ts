/**
 * Shared, dependency-free helpers for the Job Radar pipeline: HTML→text, id hashing, text
 * capping, and dedupe-key normalization. Pure functions only — trivial to unit-test.
 */

/** Max characters of description text retained per posting (keeps committed JSON small). */
export const DESCRIPTION_CAP = 4000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

/** Decode HTML entities (named + numeric, decimal and hex). Unknown entities pass through. */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, code: string) => {
    if (code[0] === '#') {
      const isHex = code[1] === 'x' || code[1] === 'X';
      const cp = isHex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : match;
    }
    return NAMED_ENTITIES[code] ?? match;
  });
}

/**
 * Convert an HTML (or already-plain) string to readable plain text. Decodes entities first (so
 * entity-encoded markup like Greenhouse's `&lt;p&gt;` becomes real tags), drops script/style,
 * turns block-closers into newlines, strips remaining tags, and collapses whitespace.
 */
export function htmlToText(html: string): string {
  const decoded = decodeEntities(html);
  const stripped = decoded
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol|section)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Cap text to `max` chars on a word boundary, appending an ellipsis when truncated. */
export function capText(text: string, max: number = DESCRIPTION_CAP): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '').trimEnd() + '…';
}

/**
 * Stable, deterministic short id from arbitrary parts (FNV-1a, 32-bit → 8 hex chars).
 * Same inputs always yield the same id, so re-runs produce stable posting ids without any deps.
 */
export function stableId(...parts: Array<string | number>): string {
  const str = parts.join(':');
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Lowercase + collapse whitespace + trim — the basis for dedupe keys. */
export function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Normalize a URL for dedupe: lowercase host/path, drop the query/hash and any trailing slash. */
export function normalizeUrl(url: string): string {
  const withoutQuery = url.split(/[?#]/)[0];
  return withoutQuery.toLowerCase().replace(/\/+$/, '');
}

/** Escape a string for literal use inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word, case-insensitive membership test: does `text` contain `keyword` as its own token,
 * not buried inside a larger alphanumeric run? The boundary is "not adjacent to a letter or
 * digit", so short keywords like `ai` / `ml` hit "AI Engineer" / "ML Platform" but never
 * "email" / "html", and multi-word keywords like `machine learning` match verbatim.
 *
 * This is the matcher the fit spec's keyword contract refers to; the pre-filter and the Tier-1
 * scorer share it so their matching is identical.
 */
export function matchesKeyword(text: string, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (needle === '') return false;
  const re = new RegExp(`(?<![a-z0-9])${escapeRegExp(needle)}(?![a-z0-9])`);
  return re.test(text.toLowerCase());
}

/** True if `text` matches any keyword in `keywords` (whole-word, case-insensitive). */
export function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(text, keyword));
}

/** Every keyword in `keywords` that matches `text` — for reporting which terms hit. */
export function matchedKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => matchesKeyword(text, keyword));
}
