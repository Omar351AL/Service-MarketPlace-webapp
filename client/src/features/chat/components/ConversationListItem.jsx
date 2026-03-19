import { formatConversationTimestamp, formatNumber } from '../../../lib/utils/format.js';
import { useI18n } from '../../i18n/useI18n.js';

export const ConversationListItem = ({ conversation, isActive, onSelect }) => {
  const { t } = useI18n();
  const participantInitial = conversation.participant.name?.slice(0, 1).toUpperCase() || '?';
  const unreadCount = conversation.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      className={
        isActive
          ? 'conversation-list-item conversation-list-item--active'
          : hasUnread
            ? 'conversation-list-item conversation-list-item--unread'
            : 'conversation-list-item'
      }
      onClick={() => onSelect(conversation.id)}
    >
      <div className="conversation-list-item__identity">
        <span className="conversation-list-item__avatar">{participantInitial}</span>
        <div className="conversation-list-item__body">
          <div className="conversation-list-item__header">
            <strong>{conversation.participant.name}</strong>
            <div className="conversation-list-item__meta">
              <span>{formatConversationTimestamp(conversation.lastMessageAt || conversation.updatedAt)}</span>
              {hasUnread ? (
                <span
                  className="conversation-list-item__badge"
                  aria-label={t('chat.unreadCountLabel', { count: unreadCount })}
                >
                  {unreadCount > 99 ? '99+' : formatNumber(unreadCount)}
                </span>
              ) : null}
            </div>
          </div>
          <p
            className={
              hasUnread
                ? 'conversation-list-item__preview conversation-list-item__preview--unread'
                : 'conversation-list-item__preview'
            }
          >
            {conversation.lastMessage?.content || t('chat.startConversation')}
          </p>
        </div>
      </div>
    </button>
  );
};
