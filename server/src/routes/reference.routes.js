import { Router } from 'express';
import * as referenceController from '../controllers/reference.controller.js';
import { validateObjectIdParam } from '../validators/grievance.validator.js';

const router = Router();

router.get('/departments', referenceController.listDepartments);
router.get('/wards', referenceController.listWards);
router.get('/wards/:id', validateObjectIdParam('id'), referenceController.getWard);

export default router;
