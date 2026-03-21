import crypto from 'node:crypto';

import { OtpTokenType } from '@prisma/client';

import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_LENGTH = 6;

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashOtpCode = ({ email, code, type }) =>
  crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${normalizeEmail(email)}:${type}:${code}`)
    .digest('hex');

const generateOtpCode = () =>
  Array.from({ length: OTP_LENGTH }, () => crypto.randomInt(0, 10)).join('');

const getExpiryMinutes = (type) =>
  type === OtpTokenType.PASSWORD_RESET
    ? env.PASSWORD_RESET_EXPIRES_MINUTES
    : env.OTP_EXPIRES_MINUTES;

const invalidateOutstandingTokens = async ({ email, type }) => {
  await prisma.otpToken.updateMany({
    where: {
      email: normalizeEmail(email),
      type,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });
};

const assertResendCooldown = async ({ email, type }) => {
  const latestToken = await prisma.otpToken.findFirst({
    where: {
      email: normalizeEmail(email),
      type
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true
    }
  });

  if (!latestToken) {
    return;
  }

  const ageMs = Date.now() - latestToken.createdAt.getTime();

  if (ageMs < RESEND_COOLDOWN_MS) {
    throw new ApiError(
      429,
      'Please wait before requesting another code.',
      {
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - ageMs) / 1000)
      },
      'OTP_RESEND_COOLDOWN'
    );
  }
};

export const issueOtpToken = async ({ userId = null, email, type, enforceCooldown = false }) => {
  const normalizedEmail = normalizeEmail(email);

  if (enforceCooldown) {
    await assertResendCooldown({ email: normalizedEmail, type });
  }

  await invalidateOutstandingTokens({ email: normalizedEmail, type });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + getExpiryMinutes(type) * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      userId,
      email: normalizedEmail,
      type,
      codeHash: hashOtpCode({
        email: normalizedEmail,
        code,
        type
      }),
      expiresAt
    }
  });

  return {
    code,
    expiresAt,
    expiresInMinutes: getExpiryMinutes(type)
  };
};

export const verifyOtpToken = async ({ email, code, type }) => {
  const normalizedEmail = normalizeEmail(email);
  const otpToken = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      type
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!otpToken) {
    throw new ApiError(400, 'The code is invalid.', null, 'OTP_INVALID');
  }

  if (otpToken.consumedAt) {
    throw new ApiError(400, 'This code has already been used.', null, 'OTP_ALREADY_USED');
  }

  if (otpToken.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'The code has expired.', null, 'OTP_EXPIRED');
  }

  const expectedHash = hashOtpCode({
    email: normalizedEmail,
    code,
    type
  });

  if (expectedHash !== otpToken.codeHash) {
    throw new ApiError(400, 'The code is invalid.', null, 'OTP_INVALID');
  }

  const consumedToken = await prisma.otpToken.update({
    where: { id: otpToken.id },
    data: {
      consumedAt: new Date()
    }
  });

  return consumedToken;
};

export const normalizeOtpEmail = normalizeEmail;
