import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as aiController from '../controllers/ai.controller.js';
import { validateAiPreview } from '../validators/ai.validator.js';
import { validateObjectIdParam } from '../validators/grievance.validator.js';

const router = Router();

router.post(
  '/preview',
  authenticate,
  authorize('citizen'),
  validateAiPreview,
  aiController.previewAnalysis
);

router.get(
  '/grievances/:id/ai',
  authenticate,
  validateObjectIdParam('id'),
  aiController.getAnalysis
);

router.post(
  '/grievances/:id/ai/retry',
  authenticate,
  validateObjectIdParam('id'),
  aiController.retryAnalysis
);

router.get(
  '/grievances/:id/duplicates',
  authenticate,
  validateObjectIdParam('id'),
  aiController.getDuplicates
);

export default router;
