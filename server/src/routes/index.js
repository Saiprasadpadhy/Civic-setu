import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import referenceRoutes from './reference.routes.js';
import grievanceRoutes from './grievance.routes.js';
import officerRoutes from './officer.routes.js';
import adminRoutes from './admin.routes.js';
import aiRoutes from './ai.routes.js';
import budgetRoutes from './budget.routes.js';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use(referenceRoutes);
router.use('/ai', aiRoutes);
router.use('/grievances', grievanceRoutes);
router.use('/officer', officerRoutes);
router.use('/admin', adminRoutes);
router.use('/budget-projects', budgetRoutes);

export default router;
