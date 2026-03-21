import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { api, resolveApiAssetUrl } from '../../../lib/api/client.js';
import { formatDateTime } from '../../../lib/utils/format.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { ConversationListItem } from '../components/ConversationListItem.jsx';
import { useChatUnread } from '../hooks/useChatUnread.js';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { createChatSocket } from '../lib/chatSocket.js';

const sortConversations = (conversations) =>
  [...conversations].sort((left, right) => {
    const leftActivity = new Date(left.lastMessageAt || left.updatedAt).getTime();
    const rightActivity = new Date(right.lastMessageAt || right.updatedAt).getTime();
    return rightActivity - leftActivity;
  });

const upsertConversation = (conversations, nextConversation) =>
  sortConversations([
    nextConversation,
    ...conversations.filter((conversation) => conversation.id !== nextConversation.id)
  ]);

const appendUniqueMessage = (messages, nextMessage) =>
  messages.some((message) => message.id === nextMessage.id) ? messages : [...messages, nextMessage];

const emitWithAck = (socket, eventName, payload) =>
  new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (response) => {
      if (response?.ok) {
        resolve(response.data);
        return;
      }

      reject(new Error(response?.error || 'Socket request failed.'));
    });
  });

const isViewportNearBottom = (viewport, threshold = 72) =>
  viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= threshold;

export const ChatInboxPage = () => {
  const { direction, t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversation') || '';
  const { token, user } = useAuth();
  const { markConversationRead, setConversationUnreadCount, syncConversationsUnread } = useChatUnread();

  const socketRef = useRef(null);
  const activeConversationRef = useRef('');
  const messagesViewportRef = useRef(null);
  const composerFormRef = useRef(null);
  const composerTextareaRef = useRef(null);
  const shouldScrollToLatestRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const pendingScrollTimeoutRef = useRef(null);
  const readingConversationIdsRef = useRef(new Set());

  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false
  );
  const [mobileView, setMobileView] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 760px)').matches &&
    requestedConversationId
      ? 'chat'
      : 'list'
  );
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(requestedConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      conversation.participant.name?.toLowerCase().includes(query)
    );
  }, [conversationSearch, conversations]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) || null;

  const showMobileChatPanel = isMobileViewport && mobileView === 'chat' && Boolean(activeConversation);
  const showConversationList = !isMobileViewport || !showMobileChatPanel;
  const showActiveConversation = !isMobileViewport || showMobileChatPanel;

  const clearPendingScrollTimeout = useCallback(() => {
    if (pendingScrollTimeoutRef.current) {
      window.clearTimeout(pendingScrollTimeoutRef.current);
      pendingScrollTimeoutRef.current = null;
    }
  }, []);

  const forceScrollToBottom = useCallback(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
    shouldScrollToLatestRef.current = false;
    stickToBottomRef.current = true;
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    clearPendingScrollTimeout();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        forceScrollToBottom();

        pendingScrollTimeoutRef.current = window.setTimeout(() => {
          forceScrollToBottom();
          pendingScrollTimeoutRef.current = null;
        }, 120);
      });
    });
  }, [clearPendingScrollTimeout, forceScrollToBottom]);

  const markConversationAsReadLocally = useCallback(
    (conversationId) => {
      if (!conversationId) {
        return;
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
      markConversationRead(conversationId);
    },
    [markConversationRead]
  );

  const syncConversationReadOnServer = useCallback(
    async (conversationId) => {
      if (!conversationId || readingConversationIdsRef.current.has(conversationId)) {
        return;
      }

      readingConversationIdsRef.current.add(conversationId);

      try {
        await api.markConversationRead(conversationId, token);
        markConversationAsReadLocally(conversationId);
      } catch {
        // Keep the local UI responsive even if the explicit read-sync request fails.
      } finally {
        readingConversationIdsRef.current.delete(conversationId);
      }
    },
    [markConversationAsReadLocally, token]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)');
    const handleViewportChange = (event) => {
      setIsMobileViewport(event.matches);

      if (!event.matches) {
        setMobileView('list');
      } else if (requestedConversationId) {
        setMobileView('chat');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, [requestedConversationId]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
    shouldScrollToLatestRef.current = true;
    stickToBottomRef.current = true;
  }, [activeConversationId]);

  useEffect(() => {
    let ignore = false;

    const loadInbox = async () => {
      setIsLoadingInbox(true);
      setErrorMessage('');

      try {
        const conversationsResponse = await api.getConversations(token);
        let nextConversations = conversationsResponse.data;

        if (
          requestedConversationId &&
          !nextConversations.some((conversation) => conversation.id === requestedConversationId)
        ) {
          const conversationResponse = await api.getConversation(requestedConversationId, token);
          nextConversations = upsertConversation(nextConversations, conversationResponse.data);
        }

        if (ignore) {
          return;
        }

        const sortedConversations = sortConversations(nextConversations);
        setConversations(sortedConversations);
        syncConversationsUnread(sortedConversations);

        const nextActiveConversationId =
          requestedConversationId &&
          nextConversations.some((conversation) => conversation.id === requestedConversationId)
            ? requestedConversationId
            : nextConversations[0]?.id || '';

        setActiveConversationId(nextActiveConversationId);

        if (isMobileViewport) {
          setMobileView(requestedConversationId && nextActiveConversationId ? 'chat' : 'list');
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingInbox(false);
        }
      }
    };

    loadInbox();

    return () => {
      ignore = true;
    };
  }, [isMobileViewport, requestedConversationId, syncConversationsUnread, token]);

  useEffect(() => {
    const shouldKeepConversationInUrl = !isMobileViewport || mobileView === 'chat';
    const nextConversationId = shouldKeepConversationInUrl ? activeConversationId : '';

    if (requestedConversationId === nextConversationId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    if (nextConversationId) {
      nextParams.set('conversation', nextConversationId);
    } else {
      nextParams.delete('conversation');
    }

    setSearchParams(nextParams, { replace: true });
  }, [
    activeConversationId,
    isMobileViewport,
    mobileView,
    requestedConversationId,
    searchParams,
    setSearchParams
  ]);

  useEffect(() => {
    if (!activeConversationId) {
      clearPendingScrollTimeout();
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let ignore = false;
    const targetConversationId = activeConversationId;

    clearPendingScrollTimeout();
    setMessages([]);
    setIsLoadingMessages(true);
    setErrorMessage('');
    shouldScrollToLatestRef.current = true;
    stickToBottomRef.current = true;

    const loadMessages = async () => {
      try {
        const response = await api.getConversationMessages(targetConversationId, token);

        if (ignore || activeConversationRef.current !== targetConversationId) {
          return;
        }

        setMessages(response.data);
        markConversationAsReadLocally(targetConversationId);
      } catch (error) {
        if (!ignore && activeConversationRef.current === targetConversationId) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!ignore && activeConversationRef.current === targetConversationId) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [activeConversationId, clearPendingScrollTimeout, markConversationAsReadLocally, token]);

  useEffect(() => {
    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('connect_error', (error) => {
      setErrorMessage(error.message || t('chat.connectionError'));
    });

    socket.on('conversation:message:new', ({ message, conversation }) => {
      setConversationUnreadCount(conversation.id, conversation.unreadCount ?? 0);
      setConversations((current) => upsertConversation(current, conversation));

      if (activeConversationRef.current === message.conversationId) {
        setMessages((current) => appendUniqueMessage(current, message));

        if (message.senderId !== user?.id) {
          markConversationAsReadLocally(message.conversationId);
          void syncConversationReadOnServer(message.conversationId);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [markConversationAsReadLocally, setConversationUnreadCount, syncConversationReadOnServer, t, token, user?.id]);

  useEffect(() => {
    if (!activeConversationId || !socketRef.current) {
      return;
    }

    const joinActiveConversation = () =>
      emitWithAck(socketRef.current, 'conversation:join', {
        conversationId: activeConversationId
      }).catch(() => {});

    if (socketRef.current.connected) {
      joinActiveConversation();
      return;
    }

    socketRef.current.once('connect', joinActiveConversation);

    return () => {
      socketRef.current?.off('connect', joinActiveConversation);
    };
  }, [activeConversationId]);

  useLayoutEffect(() => {
    if (!activeConversationId || isLoadingMessages) {
      return;
    }

    if (shouldScrollToLatestRef.current || stickToBottomRef.current) {
      scheduleScrollToBottom();
    }
  }, [activeConversationId, isLoadingMessages, messages, scheduleScrollToBottom]);

  useEffect(() => {
    return () => {
      clearPendingScrollTimeout();
    };
  }, [clearPendingScrollTimeout]);

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      return;
    }

    stickToBottomRef.current = isViewportNearBottom(viewport);
  };

  const handleSelectConversation = (conversationId) => {
    clearPendingScrollTimeout();
    setErrorMessage('');
    setDraft('');
    setMessages([]);
    shouldScrollToLatestRef.current = true;
    stickToBottomRef.current = true;
    setActiveConversationId(conversationId);

    if (isMobileViewport) {
      setMobileView('chat');
    }
  };

  const handleBackToConversationList = () => {
    clearPendingScrollTimeout();
    setActiveConversationId('');
    setMessages([]);
    setDraft('');
    setMobileView('list');
    setErrorMessage('');
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setIsSending(true);
    setErrorMessage('');

    try {
      const content = draft.trim();
      const socket = socketRef.current;

      if (socket?.connected) {
        await emitWithAck(socket, 'message:send', {
          conversationId: activeConversationId,
          content
        });
      } else {
        const response = await api.sendConversationMessage(
          activeConversationId,
          { content },
          token
        );

        setConversations((current) => upsertConversation(current, response.data.conversation));
        setMessages((current) => appendUniqueMessage(current, response.data.message));
      }

      shouldScrollToLatestRef.current = true;
      setDraft('');

      if (isMobileViewport) {
        requestAnimationFrame(() => {
          composerTextareaRef.current?.focus({ preventScroll: true });
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (!draft.trim() || isSending) {
      return;
    }

    composerFormRef.current?.requestSubmit();
  };

  if (isLoadingInbox) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('chat.loadingInboxTitle')}
          description={t('chat.loadingInboxDescription')}
        />
      </div>
    );
  }

  return (
    <div className={isMobileViewport ? 'chat-page chat-page--mobile' : 'chat-page'}>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      {conversations.length === 0 ? (
        <EmptyState
          title={t('chat.noConversationsTitle')}
          description={t('chat.noConversationsDescription')}
          action={
            <Link to="/browse" className="button button--small">
              {t('chat.browseListings')}
            </Link>
          }
        />
      ) : (
        <section
          className={
            isMobileViewport
              ? 'chat-workspace chat-workspace--mobile chat-layout chat-layout--mobile'
              : 'chat-workspace chat-layout'
          }
        >
          {showConversationList ? (
            <aside className={isMobileViewport ? 'chat-sidebar chat-sidebar--mobile' : 'chat-sidebar'}>
              <header className="chat-sidebar__header">
                <div>
                  <h1>{t('chat.inbox')}</h1>
                  <p>{t('chat.conversationsCount', { count: conversations.length })}</p>
                </div>

                <label className="chat-sidebar__search">
                  <Search size={16} className="chat-sidebar__search-icon" />
                  <input
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder={t('chat.searchPlaceholder')}
                    aria-label={t('chat.searchPlaceholder')}
                  />
                </label>
              </header>

              <div className="conversation-list">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onSelect={handleSelectConversation}
                    />
                  ))
                ) : (
                  <div className="conversation-list__empty">{t('chat.noConversationMatches')}</div>
                )}
              </div>
            </aside>
          ) : null}

          {showActiveConversation ? (
            <section className={isMobileViewport ? 'chat-panel chat-panel--mobile' : 'chat-panel'}>
              {activeConversation ? (
                <>
                  <header className="chat-panel__header">
                    <div className="chat-panel__header-main">
                      {isMobileViewport ? (
                        <button
                          type="button"
                          className="chat-panel__back"
                          onClick={handleBackToConversationList}
                          aria-label={t('chat.backToInbox')}
                        >
                          {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                        </button>
                      ) : null}

                      <div className="chat-panel__identity">
                        {activeConversation.participant.avatarUrl ? (
                          <img
                            src={resolveApiAssetUrl(activeConversation.participant.avatarUrl)}
                            alt={activeConversation.participant.name}
                            className="chat-avatar chat-avatar__image"
                          />
                        ) : (
                          <span className="chat-avatar">
                            {activeConversation.participant.name?.slice(0, 1).toUpperCase() || '?'}
                          </span>
                        )}
                        <div>
                          <Link
                            to={`/users/${activeConversation.participant.id}`}
                            className="chat-panel__participant-link"
                          >
                            <h2>{activeConversation.participant.name}</h2>
                          </Link>
                          <p className="chat-panel__subtitle">
                            {formatDateTime(activeConversation.lastMessageAt || activeConversation.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isMobileViewport ? (
                      <Link to={`/users/${activeConversation.participant.id}`} className="ghost-link">
                        {t('common.viewProfile')}
                      </Link>
                    ) : null}
                  </header>

                  <div className="chat-messages" ref={messagesViewportRef} onScroll={handleMessagesScroll}>
                    {isLoadingMessages ? (
                      <LoadingPanel
                        title={t('chat.loadingMessagesTitle')}
                        description={t('chat.loadingMessagesDescription')}
                      />
                    ) : messages.length === 0 ? (
                      <EmptyState
                        title={t('chat.noMessagesTitle')}
                        description={t('chat.noMessagesDescription')}
                      />
                    ) : (
                      messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwnMessage={message.senderId === user?.id}
                        />
                      ))
                    )}
                  </div>

                  <footer className="chat-panel__footer">
                    <form ref={composerFormRef} className="chat-composer" onSubmit={handleSendMessage}>
                      <textarea
                        ref={composerTextareaRef}
                        rows="3"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder={t('chat.sendPlaceholder', {
                          name: activeConversation.participant.name
                        })}
                      />
                      <div className="chat-composer__actions">
                        <button type="submit" className="button button--small" disabled={isSending}>
                          {isSending ? t('chat.sending') : t('chat.send')}
                        </button>
                      </div>
                    </form>
                  </footer>
                </>
              ) : (
                <EmptyState
                  title={t('chat.selectConversationTitle')}
                  description={t('chat.selectConversationDescription')}
                />
              )}
            </section>
          ) : null}
        </section>
      )}
    </div>
  );
};
