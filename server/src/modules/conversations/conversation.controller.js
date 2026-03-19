import { asyncHandler } from '../../utils/asyncHandler.js';

import { createConversationSchema, sendMessageSchema } from './conversation.validation.js';
import {
  createMessage,
  getConversationUnreadCount,
  formatConversationForUser,
  getConversationByIdForUser,
  getOrCreateConversation,
  listConversationsForUser,
  listMessagesForConversation,
  markConversationAsRead
} from './conversation.service.js';

export const listConversationsController = asyncHandler(async (req, res) => {
  const conversations = await listConversationsForUser(req.user.id);

  res.json({
    data: conversations
  });
});

export const createConversationController = asyncHandler(async (req, res) => {
  const payload = createConversationSchema.parse(req.body);
  const conversation = await getOrCreateConversation(req.user.id, payload.participantUserId);

  res.status(201).json({
    data: conversation
  });
});

export const getConversationController = asyncHandler(async (req, res) => {
  const conversation = await getConversationByIdForUser(req.params.conversationId, req.user.id);

  res.json({
    data: conversation
  });
});

export const listConversationMessagesController = asyncHandler(async (req, res) => {
  const messages = await listMessagesForConversation(req.params.conversationId, req.user.id);

  res.json({
    data: messages
  });
});

export const createConversationMessageController = asyncHandler(async (req, res) => {
  const payload = sendMessageSchema.parse(req.body);
  const result = await createMessage({
    conversationId: req.params.conversationId,
    senderId: req.user.id,
    content: payload.content
  });

  res.status(201).json({
    data: {
      message: result.message,
      conversation: formatConversationForUser(
        result.conversation,
        req.user.id,
        await getConversationUnreadCount(result.conversation.id, req.user.id)
      )
    }
  });
});

export const markConversationReadController = asyncHandler(async (req, res) => {
  await markConversationAsRead(req.params.conversationId, req.user.id);

  res.json({
    data: {
      conversationId: req.params.conversationId,
      unreadCount: 0
    }
  });
});
