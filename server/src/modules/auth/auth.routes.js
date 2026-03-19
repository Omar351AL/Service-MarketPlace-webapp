import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth.middleware.js';

import {
  getAuthConfigController,
  getCurrentUserController,
  loginController,
  registerController
} from './auth.controller.js';

const router = Router();

router.get('/config', getAuthConfigController);
router.post('/register', registerController);
router.post('/login', loginController);
router.get('/me', requireAuth, getCurrentUserController);

export default router;
