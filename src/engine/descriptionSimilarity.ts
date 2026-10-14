const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'of', 'is', 'are', 'was', 'were', 'it', 'this', 'that', 'your', 'our', 'all'
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-z]{2,}\b/g) || []).filter(w => !STOPWORDS.has(w));
}

export function computeDescriptionSimilarity(candDesc?: string | null, refDesc?: string | null) {
  if (!candDesc || !refDesc || !candDesc.trim() || !refDesc.trim()) {
    return {
      isAvailable: false,
      rawScore: 0,
      sharedKeywords: [],
      method: 'tfidf_cosine_similarity',
      explanation: 'Description not provided for candidate or official brand profile.'
    };
  }

  const candTokens = tokenize(candDesc);
  const refTokens = tokenize(refDesc);

  if (candTokens.length === 0 || refTokens.length === 0) {
    return {
      isAvailable: false,
      rawScore: 0,
      sharedKeywords: [],
      method: 'tfidf_cosine_similarity',
      explanation: 'Insufficient lexical tokens after noise removal.'
    };
  }

  const candFreq: Record<string, number> = {};
  for (const t of candTokens) candFreq[t] = (candFreq[t] || 0) + 1;

  const refFreq: Record<string, number> = {};
  for (const t of refTokens) refFreq[t] = (refFreq[t] || 0) + 1;

  let dotProduct = 0;
  const shared: string[] = [];

  for (const [term, count] of Object.entries(candFreq)) {
    if (refFreq[term]) {
      dotProduct += count * refFreq[term];
      shared.push(term);
    }
  }

  const candMag = Math.sqrt(Object.values(candFreq).reduce((sum, v) => sum + v * v, 0));
  const refMag = Math.sqrt(Object.values(refFreq).reduce((sum, v) => sum + v * v, 0));

  const cosineSim = candMag && refMag ? dotProduct / (candMag * refMag) : 0;
  const score = Math.round(cosineSim * 1000) / 10;
  const sharedKeywords = shared.slice(0, 5);

  let explanation = '';
  if (score >= 70) {
    explanation = `High description phrasing overlap (${score}% cosine similarity). Shared terms: ${sharedKeywords.join(', ')}.`;
  } else if (score >= 35) {
    explanation = `Moderate topical overlap (${score}% cosine similarity) with official brand profile.`;
  } else {
    explanation = `Low description similarity (${score}% cosine similarity). Minimal copied narrative.`;
  }

  return {
    isAvailable: true,
    rawScore: score,
    sharedKeywords,
    method: 'tfidf_cosine_similarity',
    explanation
  };
}
