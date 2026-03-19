import { Router } from 'express';

import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import {
  getAdminStatsController,
  listAdminPostsController,
  listAdminUsersController,
  updateAdminPostStatusController,
  updateAdminUserStatusController
} from './admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', getAdminStatsController);
router.get('/users', listAdminUsersController);
router.patch('/users/:userId', updateAdminUserStatusController);
router.get('/posts', listAdminPostsController);
router.patch('/posts/:postId', updateAdminPostStatusController);

export default router;
