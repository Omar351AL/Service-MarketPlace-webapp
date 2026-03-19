import { asyncHandler } from '../../utils/asyncHandler.js';

import {
  createPostSchema,
  myPostsQuerySchema,
  normalizePostRequestBody,
  publicPostsQuerySchema,
  updatePostSchema
} from './post.validation.js';
import { cleanupUploadedFiles } from './post.upload.js';
import {
  createPost,
  deletePost,
  getPostByIdentifier,
  listMyPosts,
  listPosts,
  updatePost
} from './post.service.js';

export const listPostsController = asyncHandler(async (req, res) => {
  const query = publicPostsQuerySchema.parse(req.query);
  const response = await listPosts(query);

  res.json(response);
});

export const listMyPostsController = asyncHandler(async (req, res) => {
  const query = myPostsQuerySchema.parse(req.query);
  const response = await listMyPosts(req.user.id, query);

  res.json(response);
});

export const getPostController = asyncHandler(async (req, res) => {
  const post = await getPostByIdentifier(req.params.identifier, req.user);

  res.json({
    data: post
  });
});

export const createPostController = asyncHandler(async (req, res) => {
  try {
    const payload = createPostSchema.parse(normalizePostRequestBody(req.body));
    const post = await createPost(req.user, payload, req.files || []);

    res.status(201).json({
      message: 'Post created successfully.',
      data: post
    });
  } catch (error) {
    await cleanupUploadedFiles(req.files || []);
    throw error;
  }
});

export const updatePostController = asyncHandler(async (req, res) => {
  try {
    const payload = updatePostSchema.parse(normalizePostRequestBody(req.body));
    const post = await updatePost(req.params.identifier, req.user, payload, req.files || []);

    res.json({
      message: 'Post updated successfully.',
      data: post
    });
  } catch (error) {
    await cleanupUploadedFiles(req.files || []);
    throw error;
  }
});

export const deletePostController = asyncHandler(async (req, res) => {
  await deletePost(req.params.identifier, req.user);

  res.json({
    message: 'Post deleted successfully.'
  });
});
