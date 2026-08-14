const DEVANAGARI = /[\u0900-\u097F]/;
const ODIA = /[\u0B00-\u0B7F]/;

export function detectLanguageHeuristic(text = '') {
  if (ODIA.test(text)) return 'or';
  if (DEVANAGARI.test(text)) return 'hi';
  return 'en';
}

export function isSupportedLanguage(language) {
  return ['en', 'hi', 'or'].includes(language);
}

export function normalizeLanguage(language, fallbackText = '') {
  if (isSupportedLanguage(language)) return language;
  return detectLanguageHeuristic(fallbackText);
}
