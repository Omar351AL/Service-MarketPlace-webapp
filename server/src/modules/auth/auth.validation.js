import { z } from 'zod';

const languageSchema = z.enum(['en', 'ar']).optional();
const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP code must be 6 digits.');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  language: languageSchema
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  code: otpCodeSchema
});

export const resendVerificationOtpSchema = z.object({
  email: z.string().email(),
  language: languageSchema
});

export const requestPasswordResetOtpSchema = z.object({
  email: z.string().email(),
  language: languageSchema
});

export const resetPasswordWithOtpSchema = z
  .object({
    email: z.string().email(),
    code: otpCodeSchema,
    newPassword: z.string().trim().min(8).max(128),
    confirmNewPassword: z.string().trim().min(1)
  })
  .refine((payload) => payload.newPassword === payload.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'New password confirmation does not match.'
  });
