import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../auth/hooks/useAuth.js';
import { api } from '../../../lib/api/client.js';
import { ChatUnreadContext } from '../context/ChatUnreadContext.js';
import { createChatSocket } from '../lib/chatSocket.js';

const toUnreadMap = (conversations) =>
  Object.fromEntries(
    (conversations || []).map((conversation) => [conversation.id, conversation.unreadCount ?? 0])
  );

const sumUnreadCounts = (conversationUnreadCounts) =>
  Object.values(conversationUnreadCounts).reduce((total, count) => total + (count || 0), 0);

export const ChatUnreadProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState({});

  const refreshUnreadState = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setConversationUnreadCounts({});
      return;
    }

    try {
      const response = await api.getConversations(token);
      setConversationUnreadCounts(toUnreadMap(response.data));
    } catch {
      setConversationUnreadCounts({});
    }
  }, [isAuthenticated, token]);

  const setConversationUnreadCount = useCallback((conversationId, unreadCount) => {
    if (!conversationId) {
      return;
    }

    setConversationUnreadCounts((current) => ({
      ...current,
      [conversationId]: Math.max(0, unreadCount || 0)
    }));
  }, []);

  const markConversationRead = useCallback((conversationId) => {
    if (!conversationId) {
      return;
    }

    setConversationUnreadCounts((current) => ({
      ...current,
      [conversationId]: 0
    }));
  }, []);

  const syncConversationsUnread = useCallback((conversations) => {
    setConversationUnreadCounts(toUnreadMap(conversations));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    let ignore = false;

    const loadUnreadState = async () => {
      try {
        const response = await api.getConversations(token);

        if (!ignore) {
          setConversationUnreadCounts(toUnreadMap(response.data));
        }
      } catch {
        if (!ignore) {
          setConversationUnreadCounts({});
        }
      }
    };

    loadUnreadState();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('conversation:message:new', ({ conversation }) => {
      setConversationUnreadCounts((current) => ({
        ...current,
        [conversation.id]: Math.max(0, conversation.unreadCount ?? 0)
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const value = useMemo(
    () => {
      const effectiveConversationUnreadCounts = isAuthenticated ? conversationUnreadCounts : {};
      const totalUnreadCount = sumUnreadCounts(effectiveConversationUnreadCounts);

      return {
        conversationUnreadCounts: effectiveConversationUnreadCounts,
        totalUnreadCount,
        hasUnreadMessages: totalUnreadCount > 0,
        refreshUnreadState,
        setConversationUnreadCount,
        markConversationRead,
        syncConversationsUnread
      };
    },
    [
      conversationUnreadCounts,
      isAuthenticated,
      refreshUnreadState,
      setConversationUnreadCount,
      markConversationRead,
      syncConversationsUnread
    ]
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
};
