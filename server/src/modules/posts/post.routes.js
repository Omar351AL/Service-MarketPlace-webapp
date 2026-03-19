import { Router } from 'express';

import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware.js';
import { postImagesUploadMiddleware } from './post.upload.js';

import {
  createPostController,
  deletePostController,
  getPostController,
  listMyPostsController,
  listPostsController,
  updatePostController
} from './post.controller.js';

const router = Router();

router.get('/', listPostsController);
router.get('/mine', requireAuth, listMyPostsController);
router.get('/:identifier', optionalAuth, getPostController);
router.post('/', requireAuth, postImagesUploadMiddleware, createPostController);
router.patch('/:identifier', requireAuth, postImagesUploadMiddleware, updatePostController);
router.delete('/:identifier', requireAuth, deletePostController);

export default router;
