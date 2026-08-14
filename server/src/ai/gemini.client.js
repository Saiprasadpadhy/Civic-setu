import { env } from '../config/env.js';
import {
  buildImageAnalysisPrompt,
  buildTextAnalysisPrompt,
  IMAGE_ANALYSIS_PROMPT_VERSION,
  TEXT_ANALYSIS_PROMPT_VERSION,
} from './prompts/analysis.prompts.js';
import {
  validateImageAnalysisOutput,
  validateTextAnalysisOutput,
  parseJsonResponse,
} from './validators/output.validator.js';

function mockTextAnalysis({ title, description }) {
  const combined = `${title} ${description}`.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(title + description);
  const isOdia = /[\u0B00-\u0B7F]/.test(title + description);

  let category = 'streetlight';
  let suggestedDepartment = 'ROADS';

  if (combined.includes('pothole') || combined.includes('road') || combined.includes('गड्ढा') || combined.includes('ଗାଡ଼')) {
    category = 'pothole';
    suggestedDepartment = 'ROADS';
  } else if (combined.includes('garbage') || combined.includes('kachra') || combined.includes('waste')) {
    category = 'garbage';
    suggestedDepartment = 'SANITATION';
  } else if (combined.includes('water') || combined.includes('pani') || combined.includes('leak')) {
    category = 'water';
    suggestedDepartment = 'WATER';
  }

  const normalizedTitle = isHindi ? 'Pothole on road' : isOdia ? 'Pothole on road' : title;
  const normalizedDescription = isHindi ? 'Large pothole causing issues' : isOdia ? 'Large pothole causing issues' : description;

  return {
    summary: `AI generated summary for ${category} issue: ${title}`,
    category,
    suggestedDepartment,
    severity: combined.includes('large') || combined.includes('huge') || combined.includes('severe') ? 'high' : 'medium',
    urgencyExplanation: 'Urgent attention required due to traffic and safety impact.',
    language: isOdia ? 'or' : isHindi ? 'hi' : 'en',
    normalizedText: {
      title: normalizedTitle,
      description: normalizedDescription,
    },
    semanticHints: {
      safetyImpact: 0.8,
      affectedPopulation: 0.6,
      essentialServiceImpact: 0.5,
      recurrence: 0.2,
      vulnerability: 0.4,
    },
  };
}

function mockImageAnalysis() {
  return {
    likelyIssue: 'Non-functional streetlight',
    visibleDamage: 'Dark/unlit lamp visible',
    category: 'streetlight',
    observations: ['Possible electrical fault', 'Located near junction'],
    confidence: 0.82,
    uncertaintyNotes: 'Mock image analysis result.',
  };
}

async function getGeminiModel() {
  if (env.gemini.mockMode) return null;
  if (!env.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const client = new GoogleGenerativeAI(env.gemini.apiKey);
  return client.getGenerativeModel({ model: env.gemini.model });
}

async function callGeminiJson(prompt, parts = []) {
  const model = await getGeminiModel();
  if (!model) return null;

  const result = await model.generateContent([prompt, ...parts]);
  const text = result.response.text();
  return parseJsonResponse(text);
}

export async function analyzeText({ title, description, forceFailure = false }) {
  const started = Date.now();

  if (forceFailure) {
    return {
      success: false,
      error: 'Forced Gemini failure',
      model: env.gemini.mockMode ? 'mock' : env.gemini.model,
      promptVersion: TEXT_ANALYSIS_PROMPT_VERSION,
      latencyMs: Date.now() - started,
    };
  }

  try {
    let parsed;
    if (env.gemini.mockMode) {
      parsed = mockTextAnalysis({ title, description });
    } else {
      const prompt = buildTextAnalysisPrompt({ title, description });
      parsed = await callGeminiJson(prompt);
    }

    const validated = validateTextAnalysisOutput(parsed);

    return {
      success: true,
      data: validated,
      model: env.gemini.mockMode ? 'mock' : env.gemini.model,
      promptVersion: TEXT_ANALYSIS_PROMPT_VERSION,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      model: env.gemini.mockMode ? 'mock' : env.gemini.model,
      promptVersion: TEXT_ANALYSIS_PROMPT_VERSION,
      latencyMs: Date.now() - started,
    };
  }
}

export async function analyzeImage({ imageUrl, mimeType, forceFailure = false }) {
  const started = Date.now();

  if (!imageUrl) {
    return {
      success: false,
      skipped: true,
      error: 'No image provided',
      latencyMs: Date.now() - started,
    };
  }

  if (forceFailure) {
    return {
      success: false,
      error: 'Forced image analysis failure',
      latencyMs: Date.now() - started,
    };
  }

  try {
    let parsed;

    if (env.gemini.mockMode) {
      parsed = mockImageAnalysis();
    } else {
      const prompt = buildImageAnalysisPrompt();
      let parts = [];

      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          parts = [
            {
              inlineData: {
                mimeType: mimeType || response.headers.get('content-type') || 'image/jpeg',
                data: buffer.toString('base64'),
              },
            },
          ];
        }
      } catch {
        parts = [];
      }

      parsed = await callGeminiJson(prompt, parts);
    }

    const validated = validateImageAnalysisOutput(parsed);

    return {
      success: true,
      data: validated,
      model: env.gemini.mockMode ? 'mock' : env.gemini.model,
      promptVersion: IMAGE_ANALYSIS_PROMPT_VERSION,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      model: env.gemini.mockMode ? 'mock' : env.gemini.model,
      promptVersion: IMAGE_ANALYSIS_PROMPT_VERSION,
      latencyMs: Date.now() - started,
    };
  }
}

export function createInvalidTextOutput() {
  return { summary: 123, category: null };
}
