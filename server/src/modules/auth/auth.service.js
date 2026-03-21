import { OtpTokenType } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { signAccessToken } from '../../services/jwt.service.js';
import { sendOtpEmail } from '../../services/mail.service.js';
import { issueOtpToken, normalizeOtpEmail, verifyOtpToken } from '../../services/otp.service.js';
import { hashPassword, verifyPassword } from '../../services/password.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const getAuthConfig = () => ({
  googleEnabled: Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL
  )
});

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  avatarUrl: true,
  bio: true,
  createdAt: true
};

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  createdAt: user.createdAt
});

const buildAuthResponse = (user) => ({
  token: signAccessToken({
    sub: user.id,
    role: user.role
  }),
  user: sanitizeUser(user)
});

const buildOtpDispatchResponse = (email) => ({
  email,
  requiresEmailVerification: true
});

const sendVerificationOtp = async ({ user, language }) => {
  const otp = await issueOtpToken({
    userId: user.id,
    email: user.email,
    type: OtpTokenType.EMAIL_VERIFICATION
  });

  await sendOtpEmail({
    email: user.email,
    language,
    name: user.name,
    code: otp.code,
    minutes: otp.expiresInMinutes,
    type: OtpTokenType.EMAIL_VERIFICATION
  });

  return otp;
};

const sendResetOtp = async ({ user, email, language }) => {
  const otp = await issueOtpToken({
    userId: user?.id ?? null,
    email,
    type: OtpTokenType.PASSWORD_RESET
  });

  await sendOtpEmail({
    email,
    language,
    name: user?.name,
    code: otp.code,
    minutes: otp.expiresInMinutes,
    type: OtpTokenType.PASSWORD_RESET
  });
};

export const registerUser = async ({ name, email, password, language }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existingUser) {
    throw new ApiError(
      409,
      'An account with this email already exists.',
      {
        fieldErrors: {
          email: ['An account with this email already exists.']
        }
      },
      'EMAIL_EXISTS'
    );
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      emailVerifiedAt: null
    },
    select: authUserSelect
  });

  try {
    await sendVerificationOtp({
      user,
      language
    });
  } catch (error) {
    await prisma.user.delete({
      where: {
        id: user.id
      }
    });

    throw error;
  }

  return buildOtpDispatchResponse(user.email);
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      ...authUserSelect,
      passwordHash: true
    }
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Invalid email or password.', null, 'INVALID_CREDENTIALS');
  }

  if (!user.emailVerifiedAt) {
    throw new ApiError(403, 'You must verify your email first.', null, 'EMAIL_NOT_VERIFIED');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Your account is blocked.', null, 'ACCOUNT_BLOCKED');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.', null, 'INVALID_CREDENTIALS');
  }

  return buildAuthResponse(user);
};

export const verifyEmailOtpForUser = async ({ email, code }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const token = await verifyOtpToken({
    email: normalizedEmail,
    code,
    type: OtpTokenType.EMAIL_VERIFICATION
  });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: authUserSelect
  });

  if (!user) {
    throw new ApiError(404, 'User not found.', null, 'USER_NOT_FOUND');
  }

  if (user.emailVerifiedAt) {
    return {
      email: normalizedEmail,
      verified: true
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: token.consumedAt ?? new Date()
    }
  });

  return {
    email: normalizedEmail,
    verified: true
  };
};

export const resendVerificationOtp = async ({ email, language }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true
    }
  });

  if (!user || user.emailVerifiedAt) {
    return buildOtpDispatchResponse(normalizedEmail);
  }

  const otp = await issueOtpToken({
    userId: user.id,
    email: user.email,
    type: OtpTokenType.EMAIL_VERIFICATION,
    enforceCooldown: true
  });

  await sendOtpEmail({
    email: user.email,
    language,
    name: user.name,
    code: otp.code,
    minutes: otp.expiresInMinutes,
    type: OtpTokenType.EMAIL_VERIFICATION
  });

  return buildOtpDispatchResponse(normalizedEmail);
};

export const requestPasswordResetOtp = async ({ email, language }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (user) {
    await sendResetOtp({
      user,
      email: normalizedEmail,
      language
    });
  }

  return {
    success: true
  };
};

export const resetPasswordWithOtp = async ({ email, code, newPassword }) => {
  const normalizedEmail = normalizeOtpEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new ApiError(400, 'The code is invalid.', null, 'OTP_INVALID');
  }

  await verifyOtpToken({
    email: normalizedEmail,
    code,
    type: OtpTokenType.PASSWORD_RESET
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword)
    }
  });

  return {
    success: true
  };
};

export const getCurrentUserProfile = (user) => sanitizeUser(user);
