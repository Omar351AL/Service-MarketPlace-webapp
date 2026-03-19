import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta } from '../../utils/pagination.js';

const buildSearchFilter = (query) => {
  if (!query) {
    return [];
  }

  return [
    {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    }
  ];
};

const buildPostSearchFilter = (query) => {
  if (!query) {
    return [];
  }

  return [
    {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } }
      ]
    }
  ];
};

export const getAdminStats = async () => {
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    totalPosts,
    activePosts,
    hiddenPosts,
    archivedPosts,
    soldPosts,
    totalConversations,
    totalMessages
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'BLOCKED' } }),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'ACTIVE' } }),
    prisma.post.count({ where: { status: 'HIDDEN' } }),
    prisma.post.count({ where: { status: 'ARCHIVED' } }),
    prisma.post.count({ where: { status: 'SOLD' } }),
    prisma.conversation.count(),
    prisma.message.count()
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers
    },
    posts: {
      total: totalPosts,
      active: activePosts,
      hidden: hiddenPosts,
      archived: archivedPosts,
      sold: soldPosts
    },
    chat: {
      conversations: totalConversations,
      messages: totalMessages
    }
  };
};

export const listAdminUsers = async ({ q, status, page, limit }) => {
  const where = {
    AND: [...(status ? [{ status }] : []), ...buildSearchFilter(q)]
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            sentMessages: true
          }
        }
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    data: users,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const updateAdminUserStatus = async ({ adminUserId, targetUserId, status }) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      status: true
    }
  });

  if (!targetUser) {
    throw new ApiError(404, 'User not found.');
  }

  if (targetUser.id === adminUserId) {
    throw new ApiError(400, 'You cannot change your own admin status from the dashboard.');
  }

  if (targetUser.role === 'ADMIN') {
    throw new ApiError(400, 'Admin accounts cannot be moderated from this MVP dashboard.');
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    }
  });
};

export const listAdminPosts = async ({ q, status, page, limit }) => {
  const where = {
    AND: [...(status ? [{ status }] : []), ...buildPostSearchFilter(q)]
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        country: true,
        city: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            id: true,
            imageUrl: true
          }
        }
      },
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.post.count({ where })
  ]);

  return {
    data: posts,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const updateAdminPostStatus = async ({ postId, status }) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true }
  });

  if (!existingPost) {
    throw new ApiError(404, 'Post not found.');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          status: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
};
