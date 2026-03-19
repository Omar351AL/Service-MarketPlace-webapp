import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

const conversationInclude = {
  userOne: {
    select: {
      id: true,
      name: true,
      avatarUrl: true
    }
  },
  userTwo: {
    select: {
      id: true,
      name: true,
      avatarUrl: true
    }
  },
  messages: {
    orderBy: {
      createdAt: 'desc'
    },
    take: 1,
    select: {
      id: true,
      content: true,
      senderId: true,
      createdAt: true
    }
  }
};

const buildUnreadCountMap = async (conversationIds, currentUserId) => {
  if (!conversationIds.length) {
    return new Map();
  }

  const unreadGroups = await prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: currentUserId },
      isRead: false
    },
    _count: {
      _all: true
    }
  });

  return new Map(
    unreadGroups.map((group) => [group.conversationId, group._count._all])
  );
};

const getUnreadCountForConversation = async (conversationId, currentUserId) => {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      isRead: false
    }
  });
};

export const normalizeConversationParticipants = (firstUserId, secondUserId) => {
  if (firstUserId === secondUserId) {
    throw new ApiError(400, 'You cannot start a conversation with yourself.');
  }

  return firstUserId < secondUserId
    ? { userOneId: firstUserId, userTwoId: secondUserId }
    : { userOneId: secondUserId, userTwoId: firstUserId };
};

const ensureParticipantExists = async (participantUserId) => {
  const participant = await prisma.user.findUnique({
    where: { id: participantUserId },
    select: {
      id: true,
      status: true
    }
  });

  if (!participant || participant.status !== 'ACTIVE') {
    throw new ApiError(404, 'That user is not available for chat.');
  }

  return participant;
};

export const ensureActiveChatUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true
    }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Your account is not allowed to use chat right now.');
  }

  return user;
};

const ensureConversationParticipant = (conversation, userId) => {
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found.');
  }

  if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
    throw new ApiError(403, 'You do not have access to this conversation.');
  }
};

export const formatConversationForUser = (conversation, currentUserId, unreadCount = 0) => {
  const otherParticipant =
    conversation.userOne.id === currentUserId ? conversation.userTwo : conversation.userOne;

  return {
    id: conversation.id,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    participant: otherParticipant,
    lastMessage: conversation.messages[0] ?? null,
    unreadCount
  };
};

export const getConversationByIdForUser = async (conversationId, currentUserId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude
  });

  ensureConversationParticipant(conversation, currentUserId);
  const unreadCount = await getUnreadCountForConversation(conversationId, currentUserId);
  return formatConversationForUser(conversation, currentUserId, unreadCount);
};

export const listConversationsForUser = async (currentUserId) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userOneId: currentUserId }, { userTwoId: currentUserId }]
    },
    include: conversationInclude
  });

  const unreadCountMap = await buildUnreadCountMap(
    conversations.map((conversation) => conversation.id),
    currentUserId
  );

  return conversations
    .sort((left, right) => {
      const leftActivity = new Date(left.lastMessageAt ?? left.updatedAt).getTime();
      const rightActivity = new Date(right.lastMessageAt ?? right.updatedAt).getTime();
      return rightActivity - leftActivity;
    })
    .map((conversation) =>
      formatConversationForUser(
        conversation,
        currentUserId,
        unreadCountMap.get(conversation.id) ?? 0
      )
    );
};

export const getOrCreateConversation = async (currentUserId, participantUserId) => {
  await ensureActiveChatUser(currentUserId);
  await ensureParticipantExists(participantUserId);
  const normalized = normalizeConversationParticipants(currentUserId, participantUserId);

  const conversation = await prisma.conversation.upsert({
    where: {
      userOneId_userTwoId: normalized
    },
    update: {},
    create: normalized,
    include: conversationInclude
  });

  const unreadCount = await getUnreadCountForConversation(conversation.id, currentUserId);
  return formatConversationForUser(conversation, currentUserId, unreadCount);
};

export const listMessagesForConversation = async (conversationId, currentUserId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userOneId: true,
      userTwoId: true
    }
  });

  ensureConversationParticipant(conversation, currentUserId);

  const [, messages] = await prisma.$transaction([
    prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        isRead: false
      },
      data: {
        isRead: true
      }
    }),
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        isRead: true
      }
    })
  ]);

  return messages;
};

export const markConversationAsRead = async (conversationId, currentUserId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userOneId: true,
      userTwoId: true
    }
  });

  ensureConversationParticipant(conversation, currentUserId);

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return { success: true };
};

export const createMessage = async ({ conversationId, senderId, content }) => {
  await ensureActiveChatUser(senderId);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userOne: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      userTwo: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  ensureConversationParticipant(conversation, senderId);

  const messageTimestamp = new Date();

  const [message, updatedConversation] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim()
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
        isRead: true
      }
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: messageTimestamp
      },
      include: conversationInclude
    })
  ]);

  return {
    message,
    conversation: updatedConversation
  };
};

export const getConversationUnreadCount = getUnreadCountForConversation;
