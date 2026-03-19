import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { env, uploadsDirectory } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const postUploadsDirectory = path.join(uploadsDirectory, 'posts');

fs.mkdirSync(postUploadsDirectory, { recursive: true });

const buildSafeFilename = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, postUploadsDirectory);
  },
  filename: (_req, file, callback) => {
    callback(null, buildSafeFilename(file));
  }
});

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new ApiError(400, 'Only JPG, PNG, WEBP, and GIF images are allowed.'));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.POST_IMAGE_MAX_SIZE_MB * 1024 * 1024,
    files: 10
  }
});

export const postImagesUploadMiddleware = upload.array('images', 10);

export const buildUploadedImageUrl = (file) =>
  `${env.UPLOADS_URL_PATH}/posts/${file.filename}`;

export const cleanupUploadedFiles = async (files = []) => {
  await Promise.all(
    files.map((file) => fs.promises.unlink(file.path).catch(() => undefined))
  );
};

const toStoredFilePath = (imageUrl) => {
  const normalizedPath = `${env.UPLOADS_URL_PATH}/posts/`;

  if (!imageUrl?.startsWith(normalizedPath)) {
    return null;
  }

  return path.join(postUploadsDirectory, imageUrl.slice(normalizedPath.length));
};

export const deleteStoredPostImages = async (images = []) => {
  await Promise.all(
    images
      .map((image) => toStoredFilePath(image.imageUrl))
      .filter(Boolean)
      .map((filePath) => fs.promises.unlink(filePath).catch(() => undefined))
  );
};
