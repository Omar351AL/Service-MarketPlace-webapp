import { prisma } from '../../db/prisma.js';
import { hashPassword, verifyPassword } from '../../services/password.service.js';
import { signAccessToken } from '../../services/jwt.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';

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
  avatarUrl: true,
  bio: true,
  createdAt: true
};

const normalizeEmail = (email) => email.trim().toLowerCase();

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
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

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password)
    },
    select: authUserSelect
  });

  return buildAuthResponse(user);
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      ...authUserSelect,
      passwordHash: true
    }
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Your account is blocked.');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return buildAuthResponse(user);
};

export const getCurrentUserProfile = (user) => sanitizeUser(user);
