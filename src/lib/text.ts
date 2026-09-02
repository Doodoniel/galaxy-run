/**
 * Answer checking for typed input.
 *
 * A Pre-A1 pilot typing "Chameleon." or "a chameleon" has got it right, and
 * being told otherwise teaches them nothing except that the machine is fussy.
 * Spelling still has to be right — that is the point of typing it — but case,
 * spacing, articles and trailing punctuation are not.
 */
export function normalise(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z' ]/g, '')
    .replace(/^(to|a|an|the)\s+/, '')
    .replace(/\s+/g, ' ');
}

export const sameWord = (a: string, b: string) => normalise(a) === normalise(b);

/** "chameleon" → "c · · · · · · · · ·" — a nudge, not the answer. */
export function letterHint(word: string) {
  const clean = word.replace(/^(to|a|an|the)\s+/i, '');
  return clean
    .split('')
    .map((c, i) => (i === 0 ? c : c === ' ' ? '  ' : '·'))
    .join(' ');
}
