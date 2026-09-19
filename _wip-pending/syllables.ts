/**
 * Spanish syllabification.
 *
 * Implements the standard rules taught in Spanish primary school
 * (RAE — Ortografía 2010, §3.3):
 *  - Single consonant between vowels goes with the next syllable: ca·sa.
 *  - Two consonants split between syllables — except "muta cum liquida"
 *    pairs (p/b/t/d/c/g/f + l/r) and digraphs ch/ll/rr, which stay
 *    together and attach to the next syllable: a·blan·dar, ha·blo, ca·rro.
 *  - Three consonants: last two if they form muta cum liquida go with
 *    the next syllable (ins·truc·ción), otherwise the last one does
 *    (trans·por·te).
 *  - Vowel groups: weak + strong, strong + weak, weak + weak form a
 *    diphthong (one nucleus). Two strong vowels or an accented weak
 *    between strongs break the syllable (hiatus).
 */

const VOWELS = "aeiouáéíóúü";
const STRONG = "aeoáéó";
const ACCENT_WEAK = "íúý";

const MUTA_C1 = "pbtdcgf";
const MUTA_C2 = "lr";

function isVowel(c: string): boolean {
  return VOWELS.includes(c);
}

function isStrong(c: string): boolean {
  return STRONG.includes(c);
}

function isAccentWeak(c: string): boolean {
  return ACCENT_WEAK.includes(c);
}

function formsDiphthong(a: string, b: string): boolean {
  if (isAccentWeak(a) || isAccentWeak(b)) return false;
  if (isStrong(a) && isStrong(b)) return false;
  return true;
}

function isInseparable(c1: string, c2: string): boolean {
  // Digraphs that represent a single sound and never split.
  if (c1 === c2 && (c1 === "l" || c1 === "r")) return true;
  if (c1 === "c" && c2 === "h") return true;
  // Muta cum liquida: stop/fricative + liquid.
  return MUTA_C1.includes(c1) && MUTA_C2.includes(c2);
}

/**
 * Hand-tuned overrides for words where the algorithm or RAE rules
 * produce a result that confuses pre-readers. Add words here only after
 * verifying the algorithm gets them wrong.
 */
const OVERRIDES: Record<string, string[]> = {
  // None at the moment — algorithm covers the curriculum.
};

export function splitSyllables(word: string): string[] {
  const original = word.trim();
  const w = original.toLowerCase();
  if (OVERRIDES[w]) return OVERRIDES[w];
  if (w.length <= 2) return [w];

  const breaks: number[] = [];
  let i = 0;

  // Skip leading consonants (onset of the first syllable).
  while (i < w.length && !isVowel(w[i])) i++;

  while (i < w.length) {
    // Extend the nucleus across diphthongs/triphthongs.
    while (i + 1 < w.length && isVowel(w[i + 1]) && formsDiphthong(w[i], w[i + 1])) {
      i++;
    }

    // Find the next vowel after the nucleus.
    let j = i + 1;
    while (j < w.length && !isVowel(w[j])) j++;
    if (j >= w.length) break;

    const consonants = w.slice(i + 1, j);
    const cn = consonants.length;

    let breakPos: number;
    if (cn === 0) {
      breakPos = i + 1;
    } else if (cn === 1) {
      breakPos = i + 1;
    } else if (cn === 2) {
      breakPos = isInseparable(consonants[0], consonants[1]) ? i + 1 : i + 2;
    } else {
      const last1 = consonants[cn - 1];
      const last2 = consonants[cn - 2];
      breakPos = isInseparable(last2, last1) ? i + 1 + (cn - 2) : i + 1 + (cn - 1);
    }

    breaks.push(breakPos);
    i = j;
  }

  const out: string[] = [];
  let prev = 0;
  for (const b of breaks) {
    if (b > prev) out.push(w.slice(prev, b));
    prev = b;
  }
  out.push(w.slice(prev));

  // Restore original casing on the first syllable if the input started uppercase.
  const result = out.filter((s) => s.length > 0);
  if (result.length > 0 && original[0] !== original[0].toLowerCase()) {
    result[0] = result[0][0].toUpperCase() + result[0].slice(1);
  }
  return result;
}
