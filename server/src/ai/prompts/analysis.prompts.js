export const TEXT_ANALYSIS_PROMPT_VERSION = 'text-v1';
export const IMAGE_ANALYSIS_PROMPT_VERSION = 'image-v1';

export function buildTextAnalysisPrompt({ title, description }) {
  return `You are a civic grievance triage assistant for India.
Analyze the grievance text and respond with ONLY valid JSON (no markdown fences).

Required JSON schema:
{
  "summary": "string",
  "category": "string",
  "suggestedDepartment": "string",
  "severity": "low|medium|high|critical",
  "urgencyExplanation": "string",
  "language": "en|hi|or",
  "normalizedText": {
    "title": "string in English",
    "description": "string in English"
  },
  "semanticHints": {
    "safetyImpact": 0.0,
    "affectedPopulation": 0.0,
    "essentialServiceImpact": 0.0,
    "recurrence": 0.0,
    "vulnerability": 0.0
  }
}

Rules:
- Detect language among English (en), Hindi (hi), Odia (or).
- Preserve meaning in normalized English text.
- semanticHints values must be between 0 and 1.
- Do NOT assign final priority labels like LOW/MEDIUM/HIGH/CRITICAL.
- category should be a concise civic issue category slug such as garbage, pothole, streetlight, water, drainage.

Grievance title: ${title}
Grievance description: ${description}`;
}

export function buildImageAnalysisPrompt() {
  return `You are analyzing a civic grievance photo.
Respond with ONLY valid JSON (no markdown fences).

Required JSON schema:
{
  "likelyIssue": "string",
  "visibleDamage": "string",
  "category": "string",
  "observations": ["string"],
  "confidence": 0.0,
  "uncertaintyNotes": "string"
}

Rules:
- confidence must be between 0 and 1.
- If image is unclear, lower confidence and explain in uncertaintyNotes.`;
}
