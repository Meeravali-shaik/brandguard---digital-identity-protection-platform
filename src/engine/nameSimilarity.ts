// Deterministic Unicode Confusables & RapidFuzz Equivalent in TypeScript

const HOMOGLYPH_MAP: Record<string, string> = {
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
  'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w',
  'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'І': 'I', 'Ј': 'J',
  'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'Ү': 'Y',
};

const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's'
};

export function normalizeUnicode(text: string): { normalized: string; hasHomoglyphs: boolean } {
  if (!text) return { normalized: '', hasHomoglyphs: false };
  const nfkc = text.normalize('NFKC');
  let hasHomoglyphs = false;
  let result = '';

  for (const ch of nfkc) {
    if (HOMOGLYPH_MAP[ch]) {
      result += HOMOGLYPH_MAP[ch];
      hasHomoglyphs = true;
    } else {
      result += ch;
    }
  }

  return { normalized: result, hasHomoglyphs };
}

export function cleanTokenString(text: string): string {
  const { normalized } = normalizeUnicode(text);
  return normalized.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function levenshteinRatio(s1: string, s2: string): number {
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const dist = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

function tokenSortRatio(s1: string, s2: string): number {
  const t1 = s1.toLowerCase().split(/\s+/).sort().join(' ');
  const t2 = s2.toLowerCase().split(/\s+/).sort().join(' ');
  return levenshteinRatio(t1, t2);
}

export function computeNameSimilarity(candidateName: string, referenceName: string) {
  if (!candidateName || !referenceName) {
    return {
      score: 0,
      isExact: false,
      hasHomoglyphs: false,
      rawCandidate: candidateName,
      rawReference: referenceName,
      normalizedCandidate: '',
      normalizedReference: '',
      method: 'string_distance',
      explanation: 'Candidate or reference name is missing.'
    };
  }

  const { normalized: normCand, hasHomoglyphs: candHomoglyph } = normalizeUnicode(candidateName);
  const { normalized: normRef } = normalizeUnicode(referenceName);

  const cleanCand = cleanTokenString(normCand);
  const cleanRef = cleanTokenString(normRef);

  // 1. Exact string match
  if (candidateName.trim() === referenceName.trim()) {
    return {
      score: 100,
      isExact: true,
      hasHomoglyphs: false,
      rawCandidate: candidateName,
      rawReference: referenceName,
      normalizedCandidate: normCand,
      normalizedReference: normRef,
      method: 'exact_match',
      explanation: `Candidate name '${candidateName}' exactly matches registered brand '${referenceName}'.`
    };
  }

  // 2. Homoglyph spoofing
  if (candHomoglyph && cleanCand === cleanRef) {
    return {
      score: 96,
      isExact: false,
      hasHomoglyphs: true,
      rawCandidate: candidateName,
      rawReference: referenceName,
      normalizedCandidate: normCand,
      normalizedReference: normRef,
      method: 'unicode_homoglyph_deobfuscation',
      explanation: `Candidate name '${candidateName}' contains confusable homoglyphs mapping directly to '${referenceName}'.`
    };
  }

  // 3. Leetspeak substitution
  let deleetCand = cleanCand;
  for (const [k, v] of Object.entries(LEETSPEAK_MAP)) {
    deleetCand = deleetCand.split(k).join(v);
  }

  if (deleetCand === cleanRef && cleanCand !== cleanRef) {
    return {
      score: 92,
      isExact: false,
      hasHomoglyphs: false,
      rawCandidate: candidateName,
      rawReference: referenceName,
      normalizedCandidate: normCand,
      normalizedReference: normRef,
      method: 'leetspeak_substitution',
      explanation: `Candidate name '${candidateName}' uses leetspeak substitution of '${referenceName}'.`
    };
  }

  // 4. Levenshtein & token ratio
  const ratio = levenshteinRatio(cleanCand, cleanRef);
  const tokenRatio = tokenSortRatio(candidateName, referenceName);
  const compositeScore = Math.max(ratio, tokenRatio);

  let explanation = `Candidate name '${candidateName}' has ${compositeScore}% similarity to brand '${referenceName}'.`;
  if (compositeScore >= 80 && Math.abs(cleanCand.length - cleanRef.length) <= 2) {
    explanation += ' Demonstrates single/double character alteration.';
  }

  return {
    score: compositeScore,
    isExact: false,
    hasHomoglyphs: candHomoglyph,
    rawCandidate: candidateName,
    rawReference: referenceName,
    normalizedCandidate: normCand,
    normalizedReference: normRef,
    method: 'rapidfuzz_levenshtein',
    explanation
  };
}
