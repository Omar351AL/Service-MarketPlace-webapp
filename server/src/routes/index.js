import { Router } from 'express';

import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import conversationRoutes from '../modules/conversations/conversation.routes.js';
import postRoutes from '../modules/posts/post.routes.js';
import userRoutes from '../modules/users/user.routes.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    });
  })
);

router.get('/', (_req, res) => {
  res.json({
    name: 'Service Marketplace API',
    version: '1.0.0',
    docsHint: 'See the project README for local development instructions.'
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/conversations', conversationRoutes);
router.use('/posts', postRoutes);
router.use('/users', userRoutes);

export default router;
