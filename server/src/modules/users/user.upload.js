import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { env, uploadsDirectory } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const avatarUploadsDirectory = path.join(uploadsDirectory, 'avatars');
const avatarUrlPrefix = `${env.UPLOADS_URL_PATH}/avatars/`;

fs.mkdirSync(avatarUploadsDirectory, { recursive: true });

const buildSafeFilename = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarUploadsDirectory);
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
    files: 1
  }
});

export const profileAvatarUploadMiddleware = upload.single('avatar');

export const buildUploadedAvatarUrl = (file) => `${avatarUrlPrefix}${file.filename}`;

export const cleanupUploadedAvatarFile = async (file) => {
  if (!file?.path) {
    return;
  }

  await fs.promises.unlink(file.path).catch(() => undefined);
};

const toStoredAvatarPath = (avatarUrl) => {
  if (!avatarUrl?.startsWith(avatarUrlPrefix)) {
    return null;
  }

  return path.join(avatarUploadsDirectory, avatarUrl.slice(avatarUrlPrefix.length));
};

export const deleteStoredAvatar = async (avatarUrl) => {
  const filePath = toStoredAvatarPath(avatarUrl);

  if (!filePath) {
    return;
  }

  await fs.promises.unlink(filePath).catch(() => undefined);
};
