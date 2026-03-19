import { z } from 'zod';

const normalizeOptionalString = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const optionalNullableUrlSchema = z.preprocess(
  normalizeOptionalString,
  z.union([z.string().url().max(500), z.null()]).optional()
);

const optionalNullableBioSchema = z.preprocess(
  normalizeOptionalString,
  z.union([z.string().max(400), z.null()]).optional()
);

const optionalBooleanSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false' || normalized === '') {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

export const updateOwnProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  avatarUrl: optionalNullableUrlSchema,
  bio: optionalNullableBioSchema,
  removeAvatar: optionalBooleanSchema
});

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().trim().min(1),
    newPassword: z.string().trim().min(8).max(128),
    confirmNewPassword: z.string().trim().min(1)
  })
  .refine((payload) => payload.newPassword === payload.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'New password confirmation does not match.'
  });
