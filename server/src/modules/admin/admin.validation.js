import { z } from 'zod';

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().optional()
);

export const adminUsersQuerySchema = z.object({
  q: optionalTrimmedString,
  status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export const adminPostsQuerySchema = z.object({
  q: optionalTrimmedString,
  status: z.enum(['ACTIVE', 'HIDDEN', 'SOLD', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED'])
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'HIDDEN', 'SOLD', 'ARCHIVED'])
});
