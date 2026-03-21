import { asyncHandler } from '../../utils/asyncHandler.js';

import {
  getAuthConfig,
  getCurrentUserProfile,
  loginUser,
  registerUser,
  requestPasswordResetOtp,
  resendVerificationOtp,
  resetPasswordWithOtp,
  verifyEmailOtpForUser
} from './auth.service.js';
import {
  loginSchema,
  registerSchema,
  requestPasswordResetOtpSchema,
  resendVerificationOtpSchema,
  resetPasswordWithOtpSchema,
  verifyEmailOtpSchema
} from './auth.validation.js';

export const getAuthConfigController = asyncHandler(async (_req, res) => {
  res.json({
    message: 'Authentication foundation is ready for Phase 2.',
    data: getAuthConfig()
  });
});

export const registerController = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const registerResponse = await registerUser(payload);

  res.status(201).json({
    message: 'Registration successful. Verify your email to continue.',
    data: registerResponse
  });
});

export const loginController = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const authResponse = await loginUser(payload);

  res.json({
    message: 'Login successful.',
    data: authResponse
  });
});

export const verifyEmailOtpController = asyncHandler(async (req, res) => {
  const payload = verifyEmailOtpSchema.parse(req.body);
  const response = await verifyEmailOtpForUser(payload);

  res.json({
    message: 'Email verified successfully.',
    data: response
  });
});

export const resendVerificationOtpController = asyncHandler(async (req, res) => {
  const payload = resendVerificationOtpSchema.parse(req.body);
  const response = await resendVerificationOtp(payload);

  res.json({
    message: 'Verification code sent successfully.',
    data: response
  });
});

export const requestPasswordResetOtpController = asyncHandler(async (req, res) => {
  const payload = requestPasswordResetOtpSchema.parse(req.body);
  await requestPasswordResetOtp(payload);

  res.json({
    message: 'If the email exists, a reset code has been sent.'
  });
});

export const resetPasswordWithOtpController = asyncHandler(async (req, res) => {
  const payload = resetPasswordWithOtpSchema.parse(req.body);
  await resetPasswordWithOtp(payload);

  res.json({
    message: 'Password reset successfully.'
  });
});

export const getCurrentUserController = asyncHandler(async (req, res) => {
  res.json({
    data: getCurrentUserProfile(req.user)
  });
});
