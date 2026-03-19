import { z } from 'zod';

import { ApiError } from '../../utils/ApiError.js';

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

const priceSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      return Number(value);
    }

    return value;
  },
  z.number().nonnegative().max(999999999.99).optional()
);

const imageUrlSchema = z.string().url().max(500);
const imageReferenceKeySchema = z.string().trim().min(1).max(120);
const countrySchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toUpperCase();
    return normalized === '' ? undefined : normalized;
  },
  z
    .string()
    .regex(/^[A-Z]{2}$/, 'Country must be a valid country code.')
    .optional()
);
const citySchema = optionalTrimmedString.transform((value) => value?.slice(0, 80));

export const publicPostsQuerySchema = z.object({
  q: optionalTrimmedString,
  category: optionalTrimmedString,
  city: optionalTrimmedString,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12)
});

export const myPostsQuerySchema = publicPostsQuerySchema.extend({
  status: z.enum(['ACTIVE', 'HIDDEN', 'SOLD', 'ARCHIVED']).optional()
});

export const createPostSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(120),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(6000),
  price: priceSchema,
  country: countrySchema,
  city: citySchema,
  categoryId: z.string().min(1, 'Category is required.'),
  status: z.enum(['ACTIVE', 'SOLD', 'ARCHIVED']).default('ACTIVE'),
  images: z.array(imageUrlSchema).max(10).optional().default([]),
  removedImageIds: z.array(z.string()).max(20).optional().default([]),
  newImageKeys: z.array(imageReferenceKeySchema).max(10).optional().default([]),
  coverImageKey: imageReferenceKeySchema.optional()
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(120).optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(6000)
    .optional(),
  price: priceSchema.or(z.null()).optional(),
  country: countrySchema.or(z.literal(null)).optional(),
  city: citySchema.or(z.literal(null)).optional(),
  categoryId: z.string().min(1, 'Category is required.').optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'ARCHIVED']).optional(),
  images: z.array(imageUrlSchema).max(10).optional(),
  removedImageIds: z.array(z.string()).max(20).optional().default([]),
  newImageKeys: z.array(imageReferenceKeySchema).max(10).optional().default([]),
  coverImageKey: imageReferenceKeySchema.optional()
});

const parseJsonArrayField = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `Invalid ${fieldName} payload.`);
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    throw new ApiError(400, `Invalid ${fieldName} payload.`);
  }
};

export const normalizePostRequestBody = (body = {}) => ({
  ...body,
  removedImageIds: parseJsonArrayField(body.removedImageIds, 'removedImageIds'),
  newImageKeys: parseJsonArrayField(body.newImageKeys, 'newImageKeys')
});
