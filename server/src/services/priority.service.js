import { PRIORITIES, SEVERITY_LEVELS } from '../constants/enums.js';

const SEVERITY_BASE = {
  low: 15,
  medium: 35,
  high: 60,
  critical: 80,
};

function scoreToPriority(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/**
 * Deterministic priority scoring.
 * Gemini provides semantic hints only — backend owns the final score.
 */
export function computePriority({
  severity = 'medium',
  safetyImpact = 0,
  affectedPopulation = 0,
  essentialServiceImpact = 0,
  recurrence = 0,
  vulnerability = 0,
  urgencyExplanation = '',
}) {
  const normalizedSeverity = SEVERITY_LEVELS.includes(severity) ? severity : 'medium';

  let score = SEVERITY_BASE[normalizedSeverity];

  score += Math.min(1, Math.max(0, safetyImpact)) * 10;
  score += Math.min(1, Math.max(0, affectedPopulation)) * 8;
  score += Math.min(1, Math.max(0, essentialServiceImpact)) * 10;
  score += Math.min(1, Math.max(0, recurrence)) * 5;
  score += Math.min(1, Math.max(0, vulnerability)) * 7;

  score = Math.min(100, Math.max(0, Math.round(score)));
  const priority = scoreToPriority(score);

  const explanation =
    urgencyExplanation?.trim() ||
    `Priority ${priority.toUpperCase()} (score ${score}) based on severity (${normalizedSeverity}), safety (${Math.round(safetyImpact * 100)}%), service impact (${Math.round(essentialServiceImpact * 100)}%), population exposure (${Math.round(affectedPopulation * 100)}%), recurrence (${Math.round(recurrence * 100)}%), and vulnerability (${Math.round(vulnerability * 100)}%).`;

  return {
    score,
    priority,
    severity: normalizedSeverity,
    explanation,
    factors: {
      severity: normalizedSeverity,
      safetyImpact,
      affectedPopulation,
      essentialServiceImpact,
      recurrence,
      vulnerability,
    },
  };
}

export function priorityFromGeminiHints(geminiResult = {}) {
  return computePriority({
    severity: geminiResult.severity ?? 'medium',
    safetyImpact: geminiResult.safetyImpact ?? 0,
    affectedPopulation: geminiResult.affectedPopulation ?? 0,
    essentialServiceImpact: geminiResult.essentialServiceImpact ?? 0,
    recurrence: geminiResult.recurrence ?? 0,
    vulnerability: geminiResult.vulnerability ?? 0,
    urgencyExplanation: geminiResult.urgencyExplanation ?? '',
  });
}

export { PRIORITIES };
