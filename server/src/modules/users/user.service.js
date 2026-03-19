import { prisma } from '../../db/prisma.js';
import { hashPassword, verifyPassword } from '../../services/password.service.js';
import { ApiError } from '../../utils/ApiError.js';

import { buildUploadedAvatarUrl, deleteStoredAvatar } from './user.upload.js';

const profilePostInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  images: {
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      imageUrl: true,
      sortOrder: true
    }
  }
};

const ownProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  bio: true,
  createdAt: true
};

export const getPublicProfile = async (userId, viewer) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      status: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isOwnerOrAdmin = viewer && (viewer.role === 'ADMIN' || viewer.id === user.id);

  if (user.status !== 'ACTIVE' && !isOwnerOrAdmin) {
    throw new ApiError(404, 'User not found.');
  }

  const posts = await prisma.post.findMany({
    where: {
      userId: user.id,
      ...(isOwnerOrAdmin ? {} : { status: { in: ['ACTIVE', 'SOLD'] } })
    },
    include: profilePostInclude,
    orderBy: { createdAt: 'desc' }
  });

  return {
    ...user,
    posts
  };
};

export const updateOwnProfile = async (userId, payload) =>
  prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name.trim(),
      ...(Object.prototype.hasOwnProperty.call(payload, 'avatarUrl')
        ? { avatarUrl: payload.avatarUrl ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, 'bio') ? { bio: payload.bio ?? null } : {})
    },
    select: ownProfileSelect
  });

export const updateOwnAccount = async (userId, payload, avatarFile) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      avatarUrl: true
    }
  });

  if (!currentUser) {
    throw new ApiError(404, 'User not found.');
  }

  const nextEmail = payload.email.trim().toLowerCase();

  if (nextEmail !== currentUser.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true }
    });

    if (existingUser) {
      throw new ApiError(409, 'Email is already in use.', {
        fieldErrors: {
          email: ['Email is already in use.']
        }
      });
    }
  }

  let nextAvatarUrl = currentUser.avatarUrl;

  if (payload.removeAvatar) {
    nextAvatarUrl = null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'avatarUrl')) {
    nextAvatarUrl = payload.avatarUrl ?? null;
  }

  if (avatarFile) {
    nextAvatarUrl = buildUploadedAvatarUrl(avatarFile);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name.trim(),
      email: nextEmail,
      avatarUrl: nextAvatarUrl,
      ...(Object.prototype.hasOwnProperty.call(payload, 'bio') ? { bio: payload.bio ?? null } : {})
    },
    select: ownProfileSelect
  });

  if (currentUser.avatarUrl && currentUser.avatarUrl !== nextAvatarUrl) {
    await deleteStoredAvatar(currentUser.avatarUrl);
  }

  return updatedUser;
};

export const changeOwnPassword = async (userId, payload) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (!user.passwordHash) {
    throw new ApiError(400, 'Password change is not available for this account.', {
      fieldErrors: {
        currentPassword: ['Password change is not available for this account.']
      }
    });
  }

  const passwordMatches = await verifyPassword(payload.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(400, 'Current password is incorrect.', {
      fieldErrors: {
        currentPassword: ['Current password is incorrect.']
      }
    });
  }

  if (payload.currentPassword === payload.newPassword) {
    throw new ApiError(400, 'New password must be different from the current password.', {
      fieldErrors: {
        newPassword: ['New password must be different from the current password.']
      }
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(payload.newPassword)
    }
  });

  return { success: true };
};
