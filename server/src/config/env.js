import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().optional()
);

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.url().optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SERVER_URL: z.url().default('http://localhost:4000'),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(12, 'JWT_SECRET must be at least 12 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_CALLBACK_URL: optionalUrl,
  UPLOADS_DIR: z.string().default('server/uploads'),
  UPLOADS_URL_PATH: z
    .string()
    .default('/uploads')
    .transform((value) => {
      const normalized = value.trim();

      if (!normalized.startsWith('/')) {
        return `/${normalized.replace(/^\/+/, '')}`;
      }

      return normalized.replace(/\/+$/, '') || '/uploads';
    }),
  POST_IMAGE_MAX_SIZE_MB: z.coerce.number().positive().max(20).default(5)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid server environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Server environment validation failed');
}

export const env = parsedEnv.data;
export const isProduction = env.NODE_ENV === 'production';
export const uploadsDirectory = path.isAbsolute(env.UPLOADS_DIR)
  ? env.UPLOADS_DIR
  : path.resolve(process.cwd(), env.UPLOADS_DIR);
