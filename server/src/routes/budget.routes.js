import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as budgetController from '../controllers/budget.controller.js';
import { validateObjectIdParam } from '../validators/grievance.validator.js';

const router = Router();

router.get('/', authenticate, budgetController.listBudgetProjects);
router.get('/analytics', authenticate, budgetController.getBudgetAnalytics);
router.post('/simulate', authenticate, budgetController.simulateBudget);

router.post(
  '/:id/vote',
  authenticate,
  authorize('citizen'),
  validateObjectIdParam('id'),
  budgetController.voteBudgetProject
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validateObjectIdParam('id'),
  budgetController.updateBudgetProjectStatus
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  budgetController.createBudgetProject
);

export default router;
