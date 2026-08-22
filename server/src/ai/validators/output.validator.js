import { SEVERITY_LEVELS } from '../../constants/enums.js';
import { isSupportedLanguage, normalizeLanguage } from '../../services/language.service.js';

function clamp01(value, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(1, Math.max(0, num));
}

function sanitizeAiString(str = '') {
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

export function parseJsonResponse(rawText = '') {
  let cleaned = String(rawText || '').trim();
  
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    cleaned = match[1].trim();
  } else {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
    }
  }

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
    summary: sanitizeAiString(data.summary),
    category: sanitizeAiString(data.category).toLowerCase(),
    suggestedDepartment: sanitizeAiString(data.suggestedDepartment),
    severity: data.severity,
    urgencyExplanation: sanitizeAiString(data.urgencyExplanation),
    language,
    normalizedText: {
      title: sanitizeAiString(data.normalizedText.title),
      description: sanitizeAiString(data.normalizedText.description),
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
    likelyIssue: sanitizeAiString(data.likelyIssue),
    visibleDamage: sanitizeAiString(data.visibleDamage),
    category: sanitizeAiString(data.category).toLowerCase(),
    observations: data.observations.map((item) => sanitizeAiString(item)).filter(Boolean),
    confidence: clamp01(data.confidence),
    uncertaintyNotes: sanitizeAiString(data.uncertaintyNotes),
  };
}
