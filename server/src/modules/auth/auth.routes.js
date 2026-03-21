import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth.middleware.js';

import {
  getAuthConfigController,
  getCurrentUserController,
  loginController,
  registerController,
  requestPasswordResetOtpController,
  resendVerificationOtpController,
  resetPasswordWithOtpController,
  verifyEmailOtpController
} from './auth.controller.js';

const router = Router();

router.get('/config', getAuthConfigController);
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/verify-email', verifyEmailOtpController);
router.post('/resend-verification', resendVerificationOtpController);
router.post('/forgot-password', requestPasswordResetOtpController);
router.post('/reset-password', resetPasswordWithOtpController);
router.get('/me', requireAuth, getCurrentUserController);

export default router;
