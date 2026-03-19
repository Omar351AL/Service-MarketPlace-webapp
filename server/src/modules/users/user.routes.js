import { Router } from 'express';

import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware.js';

import {
  changeOwnPasswordController,
  getPublicProfileController,
  updateOwnProfileController
} from './user.controller.js';
import { profileAvatarUploadMiddleware } from './user.upload.js';

const router = Router();

router.patch('/me', requireAuth, profileAvatarUploadMiddleware, updateOwnProfileController);
router.post('/me/password', requireAuth, changeOwnPasswordController);
router.get('/:userId', optionalAuth, getPublicProfileController);

export default router;
