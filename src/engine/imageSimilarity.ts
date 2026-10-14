export function computeHashDistance(hash1?: string | null, hash2?: string | null) {
  if (!hash1 || !hash2) {
    return {
      isAvailable: false,
      rawScore: 0,
      hammingDistance: null,
      method: 'perceptual_hash_hamming',
      explanation: 'Image hash not available for candidate or brand reference asset.'
    };
  }

  try {
    const clean1 = hash1.trim().toLowerCase();
    const clean2 = hash2.trim().toLowerCase();

    // Compute Hamming distance across hex characters
    let bitDiff = 0;
    const len = Math.min(clean1.length, clean2.length);
    for (let i = 0; i < len; i++) {
      const v1 = parseInt(clean1[i], 16) || 0;
      const v2 = parseInt(clean2[i], 16) || 0;
      let xor = v1 ^ v2;
      while (xor > 0) {
        bitDiff += xor & 1;
        xor >>= 1;
      }
    }
    bitDiff += Math.abs(clean1.length - clean2.length) * 4;

    let score = 0;
    let explanation = '';

    if (bitDiff === 0) {
      score = 100;
      explanation = 'Candidate logo hash is identical to official brand logo (0-bit difference).';
    } else if (bitDiff <= 5) {
      score = Math.max(0, 90 - bitDiff * 3);
      explanation = `Candidate logo shows near-identical visual features (Hamming distance ${bitDiff}/64).`;
    } else if (bitDiff <= 12) {
      score = Math.max(0, 70 - (bitDiff - 5) * 4);
      explanation = `Candidate logo shows moderate visual similarity to official brand logo (Hamming distance ${bitDiff}/64).`;
    } else {
      score = Math.max(0, 40 - bitDiff * 1.5);
      explanation = `Candidate logo differs significantly from official brand logo (Hamming distance ${bitDiff}/64).`;
    }

    return {
      isAvailable: true,
      rawScore: Math.round(score * 10) / 10,
      hammingDistance: bitDiff,
      method: 'perceptual_dhash_hamming',
      explanation
    };
  } catch (err: any) {
    return {
      isAvailable: false,
      rawScore: 0,
      hammingDistance: null,
      method: 'perceptual_hash_hamming',
      explanation: `Failed to compute image hash distance: ${err?.message || 'Error'}`
    };
  }
}
