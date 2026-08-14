import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';
import {
  analyzePreview,
  getAiAnalysis,
  getDuplicateReport,
  retryGrievanceAnalysis,
} from '../services/aiIntelligence.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const previewAnalysis = asyncHandler(async (req, res) => {
  const result = await analyzePreview(req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getAnalysis = asyncHandler(async (req, res) => {
  await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const analysis = await getAiAnalysis(req.params.id);

  if (!analysis) {
    throw new AppError('Grievance not found', 404);
  }

  res.status(200).json({
    success: true,
    data: analysis,
  });
});

export const retryAnalysis = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);

  if (req.user.role === 'citizen' && grievance.citizenId._id.toString() !== req.user.userId) {
    throw new AppError('You do not have permission to retry analysis for this grievance', 403);
  }

  const result = await retryGrievanceAnalysis(grievance._id);

  res.status(200).json({
    success: true,
    message: 'AI analysis retry completed',
    data: {
      aiStatus: result.grievance.aiStatus,
      aiError: result.grievance.aiError,
      priority: result.priority ?? null,
      spam: result.spamResult ?? null,
      duplicates: result.duplicateResult ?? null,
    },
  });
});

export const getDuplicates = asyncHandler(async (req, res) => {
  await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const duplicates = await getDuplicateReport(req.params.id);

  res.status(200).json({
    success: true,
    data: duplicates,
  });
});
