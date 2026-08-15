import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as officerController from '../controllers/officer.controller.js';
import {
  validateListFilters,
  validateObjectIdParam,
  validateRemark,
  validateResolutionEvidence,
  validateResolve,
  validateStatusUpdate,
} from '../validators/grievance.validator.js';

const router = Router();

router.use(authenticate, authorize('officer', 'admin'));

router.get('/grievances', validateListFilters, officerController.listGrievances);
router.get('/grievances/:id', validateObjectIdParam('id'), officerController.getGrievance);
router.patch(
  '/grievances/:id/status',
  validateObjectIdParam('id'),
  validateStatusUpdate,
  officerController.updateStatus
);
router.post(
  '/grievances/:id/remarks',
  validateObjectIdParam('id'),
  validateRemark,
  officerController.addRemark
);
router.post(
  '/grievances/:id/remark',
  validateObjectIdParam('id'),
  validateRemark,
  officerController.addRemark
);
router.post(
  '/grievances/:id/resolve',
  validateObjectIdParam('id'),
  validateResolve,
  officerController.resolveGrievance
);
router.post(
  '/grievances/:id/evidence',
  validateObjectIdParam('id'),
  validateResolutionEvidence,
  officerController.uploadEvidence
);
router.post(
  '/grievances/:id/claim',
  validateObjectIdParam('id'),
  officerController.claimGrievance
);

export default router;
