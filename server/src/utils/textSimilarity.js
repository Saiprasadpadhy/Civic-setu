/**
 * Lightweight text similarity for duplicate detection (deterministic).
 */
export function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function jaccardSimilarity(textA = '', textB = '') {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : intersection / union;
}

export function combineSimilarity(titleA, descA, titleB, descB) {
  const titleScore = jaccardSimilarity(titleA, titleB);
  const descScore = jaccardSimilarity(descA, descB);
  return titleScore * 0.4 + descScore * 0.6;
}
