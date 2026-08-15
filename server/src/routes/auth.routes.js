import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter.middleware(), validateRegister, authController.register);
router.post('/login', authLimiter.middleware(), validateLogin, authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/admin-only', authenticate, authorize('admin'), authController.adminOnly);

export default router;
