import { asyncHandler } from '../../utils/asyncHandler.js';

import { getAuthConfig, getCurrentUserProfile, loginUser, registerUser } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.validation.js';

export const getAuthConfigController = asyncHandler(async (_req, res) => {
  res.json({
    message: 'Authentication foundation is ready for Phase 2.',
    data: getAuthConfig()
  });
});

export const registerController = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const authResponse = await registerUser(payload);

  res.status(201).json({
    message: 'Registration successful.',
    data: authResponse
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

export const getCurrentUserController = asyncHandler(async (req, res) => {
  res.json({
    data: getCurrentUserProfile(req.user)
  });
});
