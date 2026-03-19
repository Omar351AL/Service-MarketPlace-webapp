import { sendMessageSchema } from '../modules/conversations/conversation.validation.js';
import {
  createMessage,
  ensureActiveChatUser,
  formatConversationForUser,
  getConversationByIdForUser,
  getConversationUnreadCount
} from '../modules/conversations/conversation.service.js';

const getUserRoom = (userId) => `user:${userId}`;

export const registerChatHandlers = (io, socket) => {
  const currentUserId = socket.data.user.id;
  const guardActiveChatUser = async () => {
    try {
      await ensureActiveChatUser(currentUserId);
      return true;
    } catch (error) {
      socket.emit('chat:error', {
        message: error.message
      });
      socket.disconnect(true);
      return false;
    }
  };

  socket.join(getUserRoom(currentUserId));

  socket.on('chat:ping', () => {
    socket.emit('chat:pong', {
      timestamp: new Date().toISOString()
    });
  });

  socket.on('conversation:join', async ({ conversationId }, acknowledge) => {
    try {
      if (!(await guardActiveChatUser())) {
        acknowledge?.({ ok: false, error: 'Authentication required.' });
        return;
      }

      const conversation = await getConversationByIdForUser(conversationId, currentUserId);
      socket.join(`conversation:${conversation.id}`);
      acknowledge?.({ ok: true, data: conversation });
    } catch (error) {
      acknowledge?.({ ok: false, error: error.message });
    }
  });

  socket.on('message:send', async (payload, acknowledge) => {
    try {
      if (!(await guardActiveChatUser())) {
        acknowledge?.({ ok: false, error: 'Authentication required.' });
        return;
      }

      const { content } = sendMessageSchema.parse(payload);
      const result = await createMessage({
        conversationId: payload.conversationId,
        senderId: currentUserId,
        content
      });

      const recipientId =
        result.conversation.userOne.id === currentUserId
          ? result.conversation.userTwo.id
          : result.conversation.userOne.id;
      const [senderUnreadCount, recipientUnreadCount] = await Promise.all([
        getConversationUnreadCount(result.conversation.id, currentUserId),
        getConversationUnreadCount(result.conversation.id, recipientId)
      ]);
      const senderConversation = formatConversationForUser(
        result.conversation,
        currentUserId,
        senderUnreadCount
      );
      const recipientConversation = formatConversationForUser(
        result.conversation,
        recipientId,
        recipientUnreadCount
      );

      io.to(getUserRoom(currentUserId)).emit('conversation:message:new', {
        message: result.message,
        conversation: senderConversation
      });
      io.to(getUserRoom(recipientId)).emit('conversation:message:new', {
        message: result.message,
        conversation: recipientConversation
      });

      acknowledge?.({ ok: true });
    } catch (error) {
      acknowledge?.({ ok: false, error: error.message || 'Unable to send message.' });
    }
  });
};
