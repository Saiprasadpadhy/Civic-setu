import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as citizenController from '../controllers/citizen.controller.js';
import {
  validateCreateGrievance,
  validateListFilters,
  validateObjectIdParam,
} from '../validators/grievance.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('citizen'), validateCreateGrievance, citizenController.createGrievance);
router.get('/mine', authorize('citizen'), validateListFilters, citizenController.listMyGrievances);
router.get('/:id', validateObjectIdParam('id'), citizenController.getGrievance);
router.get('/:id/timeline', validateObjectIdParam('id'), citizenController.getTimeline);
router.get('/:id/evidence', validateObjectIdParam('id'), citizenController.getEvidence);
router.patch('/:id/close', authorize('citizen'), validateObjectIdParam('id'), citizenController.closeGrievance);
router.post('/:id/close', authorize('citizen'), validateObjectIdParam('id'), citizenController.closeGrievance);

export default router;
