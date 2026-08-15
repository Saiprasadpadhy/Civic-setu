import Department from '../models/Department.js';
import Grievance from '../models/Grievance.js';
import AiInferenceLog from '../models/AiInferenceLog.js';
import { analyzeImage, analyzeText } from '../ai/gemini.client.js';
import { detectDuplicates } from './duplicate.service.js';
import { detectLanguageHeuristic } from './language.service.js';
import { priorityFromGeminiHints } from './priority.service.js';
import { detectSpam } from './spam.service.js';
import { calculateSlaHours } from './sla.service.js';

async function logInference({
  entityType,
  entityId,
  pipeline,
  model,
  promptVersion,
  inputSummary,
  output,
  success,
  error,
  latencyMs,
}) {
  return AiInferenceLog.create({
    entityType,
    entityId,
    pipeline,
    model,
    promptVersion,
    inputSummary,
    output,
    success,
    error,
    latencyMs,
  });
}

async function resolveDepartment(category, suggestedDepartmentCode) {
  if (category) {
    const byCategory = await Department.findOne({ categories: category, isActive: true });
    if (byCategory) return byCategory;
  }

  if (suggestedDepartmentCode) {
    const byCode = await Department.findOne({
      code: suggestedDepartmentCode.toUpperCase(),
      isActive: true,
    });
    if (byCode) return byCode;
  }

  return null;
}

export async function runIntelligencePipeline(grievance, options = {}) {
  const { forceFailure = false, req = null } = options;

  grievance.aiStatus = 'processing';
  grievance.aiError = null;
  await grievance.save();

  const textResult = await analyzeText({
    title: grievance.title,
    description: grievance.description,
    forceFailure,
  });

  await logInference({
    entityType: 'grievance',
    entityId: grievance._id,
    pipeline: 'text_analysis',
    model: textResult.model,
    promptVersion: textResult.promptVersion,
    inputSummary: {
      title: grievance.title,
      description: grievance.description.slice(0, 200),
    },
    output: textResult.success ? textResult.data : null,
    success: textResult.success,
    error: textResult.error,
    latencyMs: textResult.latencyMs,
  });

  let imageResult = { success: false, skipped: true };
  const firstImage = grievance.images?.[0];

  if (firstImage?.url) {
    imageResult = await analyzeImage({
      imageUrl: firstImage.url,
      mimeType: firstImage.mimeType,
      forceFailure: options.forceImageFailure,
    });

    await logInference({
      entityType: 'grievance',
      entityId: grievance._id,
      pipeline: 'image_analysis',
      model: imageResult.model,
      promptVersion: imageResult.promptVersion,
      inputSummary: { imageUrl: firstImage.url, mimeType: firstImage.mimeType },
      output: imageResult.success ? imageResult.data : null,
      success: imageResult.success,
      error: imageResult.error,
      latencyMs: imageResult.latencyMs,
    });
  }

  if (!textResult.success) {
    grievance.aiStatus = 'failed';
    grievance.aiError = textResult.error ?? 'Text analysis failed';
    grievance.originalLanguage = detectLanguageHeuristic(
      `${grievance.title} ${grievance.description}`
    );
    await grievance.save();
    return { grievance, textResult, imageResult, spamResult: null, duplicateResult: null };
  }

  const text = textResult.data;
  const department = await resolveDepartment(text.category, text.suggestedDepartment);

  const priority = priorityFromGeminiHints({
    severity: text.severity,
    ...text.semanticHints,
    urgencyExplanation: text.urgencyExplanation,
  });

  const spamResult = await detectSpam({
    citizenId: grievance.citizenId,
    title: grievance.title,
    description: grievance.description,
  });

  const duplicateResult = await detectDuplicates({
    grievanceId: grievance._id,
    title: grievance.title,
    description: grievance.description,
    titleNormalized: text.normalizedText.title,
    descriptionNormalized: text.normalizedText.description,
    category: text.category,
    wardId: grievance.wardId,
    longitude: grievance.longitude,
    latitude: grievance.latitude,
  });

  grievance.originalLanguage = text.language;
  grievance.titleNormalized = text.normalizedText.title;
  grievance.descriptionNormalized = text.normalizedText.description;
  grievance.category = text.category;
  grievance.subcategory = grievance.subcategory || text.category;
  grievance.departmentId = department?._id ?? grievance.departmentId;
  grievance.severity = priority.severity;
  grievance.priority = priority.priority;
  grievance.priorityScore = priority.score;

  const defaultSlaHours = department?.defaultSlaHours || 72;
  const hoursAllocated = calculateSlaHours({
    defaultSlaHours,
    priority: priority.priority,
  });
  const createdAt = grievance.createdAt || new Date();
  grievance.sla = {
    hoursAllocated,
    predictedDueAt: new Date(createdAt.getTime() + hoursAllocated * 60 * 60 * 1000),
    status: 'on_track',
    resolvedAt: grievance.sla?.resolvedAt || null,
  };

  grievance.aiAnalysis = {
    summary: text.summary,
    suggestedCategory: text.category,
    suggestedSubcategory: text.category,
    suggestedDepartmentId: department?._id ?? null,
    imageLabels: imageResult.success ? imageResult.data.observations : [],
    confidence: imageResult.success ? imageResult.data.confidence : textResult.success ? 0.7 : 0,
    priorityExplanation: priority.explanation,
    urgencyExplanation: text.urgencyExplanation,
    modelVersion: textResult.model,
    processedAt: new Date(),
    isPending: false,
    language: text.language,
    normalizedText: text.normalizedText,
    semanticHints: text.semanticHints,
    imageAnalysis: imageResult.success
      ? {
          likelyIssue: imageResult.data.likelyIssue,
          visibleDamage: imageResult.data.visibleDamage,
          category: imageResult.data.category,
          observations: imageResult.data.observations,
          confidence: imageResult.data.confidence,
          uncertaintyNotes: imageResult.data.uncertaintyNotes,
        }
      : firstImage?.url
        ? { error: imageResult.error ?? 'Image analysis failed' }
        : null,
  };

  grievance.spamResult = {
    score: spamResult.score,
    isSpam: spamResult.isSpam,
    reasons: spamResult.reasons,
    aiSignal: 0,
    decidedBy: spamResult.decidedBy,
    reviewedAt: new Date(),
  };

  grievance.duplicateCandidates = duplicateResult.possibleDuplicates.map((item) => ({
    grievanceId: item.grievanceId,
    confidence: item.confidence,
    matchReason: item.matchReason,
  }));
  grievance.isDuplicate = duplicateResult.highestScore >= 0.85;

  // Auto-assign to available department officer if unassigned
  if (!grievance.assignedOfficerId && grievance.departmentId) {
    const User = (await import('../models/User.js')).default;
    const availableOfficer =
      (grievance.wardId
        ? await User.findOne({
            role: 'officer',
            departmentId: grievance.departmentId,
            wardId: grievance.wardId,
            isActive: true,
          }).sort({ email: -1 })
        : null) ||
      (await User.findOne({
        role: 'officer',
        departmentId: grievance.departmentId,
        isActive: true,
      }).sort({ email: -1 }));

    if (availableOfficer) {
      grievance.assignedOfficerId = availableOfficer._id;
    }
  }

  grievance.aiStatus = 'completed';
  if (!textResult.success) {
    grievance.aiStatus = 'failed';
  }

  grievance.aiError = textResult.success ? null : textResult.error;
  await grievance.save();

  return {
    grievance,
    textResult,
    imageResult,
    priority,
    spamResult,
    duplicateResult,
  };
}

export async function analyzePreview(payload) {
  const textResult = await analyzeText({
    title: payload.title,
    description: payload.description,
  });

  if (!textResult.success) {
    return {
      aiStatus: 'failed',
      error: textResult.error,
    };
  }

  const priority = priorityFromGeminiHints({
    severity: textResult.data.severity,
    ...textResult.data.semanticHints,
    urgencyExplanation: textResult.data.urgencyExplanation,
  });

  let imageResult = { success: false, skipped: true };
  if (payload.imageUrl) {
    imageResult = await analyzeImage({
      imageUrl: payload.imageUrl,
      mimeType: payload.mimeType,
    });
  }

  const duplicateResult = await detectDuplicates({
    title: payload.title,
    description: payload.description,
    titleNormalized: textResult.data.normalizedText.title,
    descriptionNormalized: textResult.data.normalizedText.description,
    category: textResult.data.category,
    wardId: payload.wardId,
    longitude: payload.longitude,
    latitude: payload.latitude,
  });

  return {
    aiStatus: 'completed',
    textAnalysis: textResult.data,
    imageAnalysis: imageResult.success ? imageResult.data : null,
    priority,
    duplicatePreview: duplicateResult,
  };
}

export async function retryGrievanceAnalysis(grievanceId) {
  const grievance = await Grievance.findById(grievanceId);
  if (!grievance) throw new Error('Grievance not found');
  return runIntelligencePipeline(grievance);
}

export async function getAiAnalysis(grievanceId) {
  const grievance = await Grievance.findById(grievanceId)
    .select(
      'aiStatus aiError aiAnalysis spamResult duplicateCandidates isDuplicate priority priorityScore severity originalLanguage titleNormalized descriptionNormalized'
    )
    .populate('duplicateCandidates.grievanceId', 'ticketId status title createdAt')
    .populate('aiAnalysis.suggestedDepartmentId', 'name code');

  if (!grievance) return null;

  const logs = await AiInferenceLog.find({
    entityType: 'grievance',
    entityId: grievanceId,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-output');

  return {
    aiStatus: grievance.aiStatus,
    aiError: grievance.aiError,
    analysis: grievance.aiAnalysis,
    priority: {
      score: grievance.priorityScore,
      level: grievance.priority,
      severity: grievance.severity,
      explanation: grievance.aiAnalysis?.priorityExplanation,
    },
    spam: grievance.spamResult,
    duplicates: {
      candidates: grievance.duplicateCandidates,
      isLikelyDuplicate: grievance.isDuplicate,
    },
    language: {
      original: grievance.originalLanguage,
      normalizedTitle: grievance.titleNormalized,
      normalizedDescription: grievance.descriptionNormalized,
    },
    inferenceLogs: logs,
  };
}

export async function getDuplicateReport(grievanceId) {
  const grievance = await Grievance.findById(grievanceId);
  if (!grievance) return null;

  return detectDuplicates({
    grievanceId: grievance._id,
    title: grievance.title,
    description: grievance.description,
    titleNormalized: grievance.titleNormalized,
    descriptionNormalized: grievance.descriptionNormalized,
    category: grievance.category,
    wardId: grievance.wardId,
    longitude: grievance.longitude,
    latitude: grievance.latitude,
  });
}
