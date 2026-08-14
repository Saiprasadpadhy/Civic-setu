import { SEVERITY_LEVELS } from '../../constants/enums.js';
import { isSupportedLanguage, normalizeLanguage } from '../../services/language.service.js';

function clamp01(value, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(1, Math.max(0, num));
}

export function parseJsonResponse(rawText = '') {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  return JSON.parse(cleaned);
}

export function validateTextAnalysisOutput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI text output must be an object');
  }

  const requiredStrings = ['summary', 'category', 'suggestedDepartment', 'urgencyExplanation'];
  for (const field of requiredStrings) {
    if (!data[field] || typeof data[field] !== 'string') {
      throw new Error(`AI text output missing valid ${field}`);
    }
  }

  const language = normalizeLanguage(data.language, data.normalizedText?.description ?? '');
  if (!isSupportedLanguage(language)) {
    throw new Error('AI text output has invalid language');
  }

  if (!SEVERITY_LEVELS.includes(data.severity)) {
    throw new Error('AI text output has invalid severity');
  }

  if (!data.normalizedText?.title || !data.normalizedText?.description) {
    throw new Error('AI text output missing normalizedText');
  }

  const hints = data.semanticHints ?? {};

  return {
    summary: data.summary.trim(),
    category: data.category.trim().toLowerCase(),
    suggestedDepartment: data.suggestedDepartment.trim(),
    severity: data.severity,
    urgencyExplanation: data.urgencyExplanation.trim(),
    language,
    normalizedText: {
      title: data.normalizedText.title.trim(),
      description: data.normalizedText.description.trim(),
    },
    semanticHints: {
      safetyImpact: clamp01(hints.safetyImpact),
      affectedPopulation: clamp01(hints.affectedPopulation),
      essentialServiceImpact: clamp01(hints.essentialServiceImpact),
      recurrence: clamp01(hints.recurrence),
      vulnerability: clamp01(hints.vulnerability),
    },
  };
}

export function validateImageAnalysisOutput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI image output must be an object');
  }

  const requiredStrings = ['likelyIssue', 'visibleDamage', 'category', 'uncertaintyNotes'];
  for (const field of requiredStrings) {
    if (!data[field] || typeof data[field] !== 'string') {
      throw new Error(`AI image output missing valid ${field}`);
    }
  }

  if (!Array.isArray(data.observations)) {
    throw new Error('AI image output observations must be an array');
  }

  return {
    likelyIssue: data.likelyIssue.trim(),
    visibleDamage: data.visibleDamage.trim(),
    category: data.category.trim().toLowerCase(),
    observations: data.observations.map((item) => String(item).trim()).filter(Boolean),
    confidence: clamp01(data.confidence),
    uncertaintyNotes: data.uncertaintyNotes.trim(),
  };
}
