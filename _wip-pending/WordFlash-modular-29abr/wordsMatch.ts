/**
 * Fuzzy match between a child's spoken transcript and the expected word.
 *
 * Handles the realities of preschool pronunciation captured by the Web
 * Speech API: extra filler words, missing syllables, accent stripping,
 * one-character noise (alargamiento, "manzanaaa"), and common diction
 * substitutions (r→l, s→sh).
 *
 * Returns true when the expected word looks "close enough" to anything
 * the child said. False positives are far less harmful than false
 * negatives in this context — the goal is to avoid frustrating a child
 * who pronounced the word correctly but slightly off.
 */

const STRIP_REGEX = /[^a-záéíóúüñ\s]/gi;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(STRIP_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function wordsMatch(transcript: string, expected: string): boolean {
  const t = normalize(transcript);
  const e = normalize(expected);
  if (!t || !e) return false;
  if (t === e) return true;
  if (t.includes(e)) return true; // "la manzana" ⊃ "manzana"

  // Compare each token from the transcript against the expected word.
  const tokens = t.split(" ");
  for (const token of tokens) {
    if (token === e) return true;
    // Allow up to ~25% character difference for short words, capped at 2 edits.
    const tolerance = Math.min(2, Math.max(1, Math.floor(e.length / 4)));
    if (levenshtein(token, e) <= tolerance) return true;
  }
  return false;
}
