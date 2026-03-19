import { asyncHandler } from '../../utils/asyncHandler.js';

import { changeOwnPassword, getPublicProfile, updateOwnAccount } from './user.service.js';
import { cleanupUploadedAvatarFile } from './user.upload.js';
import { changeOwnPasswordSchema, updateOwnProfileSchema } from './user.validation.js';

export const getPublicProfileController = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.params.userId, req.user);

  res.json({
    data: profile
  });
});

export const updateOwnProfileController = asyncHandler(async (req, res) => {
  try {
    const payload = updateOwnProfileSchema.parse(req.body);
    const profile = await updateOwnAccount(req.user.id, payload, req.file);

    res.json({
      message: 'Profile updated successfully.',
      data: profile
    });
  } catch (error) {
    await cleanupUploadedAvatarFile(req.file);
    throw error;
  }
});

export const changeOwnPasswordController = asyncHandler(async (req, res) => {
  const payload = changeOwnPasswordSchema.parse(req.body);
  await changeOwnPassword(req.user.id, payload);

  res.json({
    message: 'Password updated successfully.'
  });
});
