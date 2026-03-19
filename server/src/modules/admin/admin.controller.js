import { asyncHandler } from '../../utils/asyncHandler.js';

import {
  adminPostsQuerySchema,
  adminUsersQuerySchema,
  updatePostStatusSchema,
  updateUserStatusSchema
} from './admin.validation.js';
import {
  getAdminStats,
  listAdminPosts,
  listAdminUsers,
  updateAdminPostStatus,
  updateAdminUserStatus
} from './admin.service.js';

export const getAdminStatsController = asyncHandler(async (_req, res) => {
  const stats = await getAdminStats();

  res.json({
    data: stats
  });
});

export const listAdminUsersController = asyncHandler(async (req, res) => {
  const query = adminUsersQuerySchema.parse(req.query);
  const response = await listAdminUsers(query);

  res.json(response);
});

export const updateAdminUserStatusController = asyncHandler(async (req, res) => {
  const payload = updateUserStatusSchema.parse(req.body);
  const user = await updateAdminUserStatus({
    adminUserId: req.user.id,
    targetUserId: req.params.userId,
    status: payload.status
  });

  res.json({
    message: 'User status updated successfully.',
    data: user
  });
});

export const listAdminPostsController = asyncHandler(async (req, res) => {
  const query = adminPostsQuerySchema.parse(req.query);
  const response = await listAdminPosts(query);

  res.json(response);
});

export const updateAdminPostStatusController = asyncHandler(async (req, res) => {
  const payload = updatePostStatusSchema.parse(req.body);
  const post = await updateAdminPostStatus({
    postId: req.params.postId,
    status: payload.status
  });

  res.json({
    message: 'Post status updated successfully.',
    data: post
  });
});
