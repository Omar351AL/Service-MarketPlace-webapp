import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../db/prisma.js';
import { parseBearerToken, verifyAccessToken } from '../services/jwt.service.js';

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  role: true,
  status: true,
  avatarUrl: true,
  bio: true,
  createdAt: true
};

const resolveAuthUser = async (req, { required }) => {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    if (required) {
      throw new ApiError(401, 'Authentication required.');
    }

    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: authUserSelect
    });

    if (!user || user.status !== 'ACTIVE') {
      if (required) {
        throw new ApiError(401, 'Invalid authentication token.');
      }

      return null;
    }

    return user;
  } catch (error) {
    if (required) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Invalid authentication token.');
    }

    return null;
  }
};

export const requireAuth = async (req, _res, next) => {
  try {
    req.user = await resolveAuthUser(req, { required: true });
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await resolveAuthUser(req, { required: false });
    next();
  } catch (error) {
    next(error);
  }
};
