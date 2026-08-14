import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  validateAssignOfficer,
  validateListFilters,
  validateObjectIdParam,
  validateStatusUpdate,
} from '../validators/grievance.validator.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/grievances', validateListFilters, adminController.listGrievances);
router.get('/officers', adminController.listOfficers);
router.get('/grievances/:id', validateObjectIdParam('id'), adminController.getGrievance);
router.get('/grievances/:id/timeline', validateObjectIdParam('id'), adminController.getTimeline);
router.get('/grievances/:id/audit', validateObjectIdParam('id'), adminController.getAuditLogs);
router.patch(
  '/grievances/:id/assign',
  validateObjectIdParam('id'),
  validateAssignOfficer,
  adminController.assignOfficer
);
router.patch(
  '/grievances/:id/status',
  validateObjectIdParam('id'),
  validateStatusUpdate,
  adminController.updateStatus
);

export default router;
