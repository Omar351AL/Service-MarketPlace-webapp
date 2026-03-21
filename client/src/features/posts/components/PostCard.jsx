import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

import { api, resolveApiAssetUrl } from '../../../lib/api/client.js';
import { formatCurrency, formatDate } from '../../../lib/utils/format.js';
import {
  getLocalizedCategoryName,
  getLocalizedPostLocation
} from '../../../lib/utils/marketplaceDisplay.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { PostStatusBadge } from './PostStatusBadge.jsx';

export const PostCard = ({ post, showActions, onDelete, variant = 'default' }) => {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { user, token } = useAuth();

  const [isStartingChat, setIsStartingChat] = useState(false);

  const heroImage = post.images?.[0]?.imageUrl;
  const isOwner = user?.id === post.user.id;
  const shouldShowActions = typeof showActions === 'boolean' ? showActions : isOwner;
  const isBrowseCard = variant === 'browse';
  const isManageCard = variant === 'manage';
  const isProfileCard = variant === 'profile';

  const locationText = getLocalizedPostLocation(post, language, t);
  const locationMeta =
    isBrowseCard && locationText === t('common.locationNotSpecified') ? '' : locationText;

  const chatLabel = language === 'ar' ? 'دردشة' : 'Chat';

  const handleStartChat = async () => {
    if (!token || !post?.user?.id || isOwner || isStartingChat) {
      return;
    }

    try {
      setIsStartingChat(true);

      const response = await api.createConversation(
        { participantUserId: post.user.id },
        token
      );

      navigate(`/messages?conversation=${response.data.id}`);
    } catch (error) {
      console.error('Failed to start conversation from post card:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const articleClassName = [
    'post-card',
    isBrowseCard ? 'post-card--browse' : '',
    isManageCard ? 'post-card--manage' : '',
    isProfileCard ? 'post-card--profile' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const metaClassName = [
    'post-card__meta',
    isBrowseCard ? 'post-card__meta--browse' : '',
    isManageCard ? 'post-card__meta--manage' : '',
    isProfileCard ? 'post-card__meta--profile' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={articleClassName}>
      <Link to={`/posts/${post.slug}`} className="post-card__media">
        {heroImage ? (
          <img src={resolveApiAssetUrl(heroImage)} alt={post.title} />
        ) : (
          <div className="post-card__placeholder">{t('common.noImageYet')}</div>
        )}
      </Link>

      <div className="post-card__body">
        <div className="post-card__topline">
          <PostStatusBadge status={post.status} />
          <span>{getLocalizedCategoryName(post.category, language)}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <Link to={`/posts/${post.slug}`} className="post-card__title">
          {post.title}
        </Link>

        <div className={metaClassName}>
          <strong className="post-card__price">{formatCurrency(post.price)}</strong>
          {locationMeta ? <span className="post-card__meta-pill">{locationMeta}</span> : null}
        </div>

        <p className="post-card__description">{post.description}</p>

        <div className="post-card__footer post-card__footer--stacked">
          <div className="post-card__seller-row">
            <Link to={`/users/${post.user.id}`} className="ghost-link post-card__seller-link">
              {post.user.name}
            </Link>

            {!isOwner ? (
              <button
                type="button"
                className="post-card__chat-button"
                onClick={handleStartChat}
                disabled={isStartingChat}
              >
                <MessageCircle size={16} />
                <span>
                  {isStartingChat
                    ? language === 'ar'
                      ? 'جارٍ الفتح...'
                      : 'Opening...'
                    : chatLabel}
                </span>
              </button>
            ) : null}
          </div>

          {shouldShowActions ? (
            <div className="post-card__actions">
              <Link to={`/posts/${post.slug}/edit`} className="ghost-link">
                {t('posts.edit')}
              </Link>

              {onDelete ? (
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={() => onDelete(post)}
                >
                  {t('posts.delete')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
