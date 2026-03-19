import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { api } from '../../../lib/api/client.js';
import { formatCurrency, formatDate } from '../../../lib/utils/format.js';
import { getLocalizedCategoryName, getLocalizedPostLocation } from '../../../lib/utils/marketplaceDisplay.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { PostImageGallery } from '../components/PostImageGallery.jsx';
import { PostStatusBadge } from '../components/PostStatusBadge.jsx';

export const PostDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { identifier } = useParams();
  const { language, t } = useI18n();
  const { isAuthenticated, token, user } = useAuth();
  const [post, setPost] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    api
      .getPost(identifier, token)
      .then((response) => {
        if (!ignore) {
          setPost(response.data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [identifier, token]);

  if (!post && !errorMessage) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('posts.postDetailsLoadingTitle')}
          description={t('posts.postDetailsLoadingDescription')}
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="page-stack">
        <EmptyState title={t('posts.postErrorTitle')} description={errorMessage} />
      </div>
    );
  }

  const isOwner = user?.id === post.user.id;

  const handleDeletePost = async () => {
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await api.deletePost(post.slug, token);
      setIsDeleteDialogOpen(false);
      navigate('/create-post');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }

    if (isOwner) {
      return;
    }

    setIsStartingConversation(true);
    setErrorMessage('');

    try {
      const response = await api.createConversation(
        {
          participantUserId: post.user.id
        },
        token
      );

      navigate(`/messages?conversation=${encodeURIComponent(response.data.id)}`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsStartingConversation(false);
    }
  };

  return (
    <article className="page-stack">
      <section className="post-detail">
        <div className="post-detail__gallery">
          <PostImageGallery images={post.images} title={post.title} />
        </div>

        <div className="post-detail__content">
          <div className="post-card__topline">
            <PostStatusBadge status={post.status} />
            <span>{getLocalizedCategoryName(post.category, language)}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>

          <h1 className="post-detail__title">{post.title}</h1>
          <p className="post-detail__price">{formatCurrency(post.price)}</p>
          <p className="post-detail__location">{getLocalizedPostLocation(post, language, t)}</p>
          <p className="post-detail__description">{post.description}</p>

          <div className="post-detail__actions">
            <Link to={`/users/${post.user.id}`} className="button button--small">
              {t('common.viewSellerProfile')}
            </Link>
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="button button--small button--muted"
                  onClick={() => navigate(`/posts/${post.slug}/edit`)}
                >
                  {t('posts.editPost')}
                </button>
                <button
                  type="button"
                  className="button button--small button--danger"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('common.deleting') : t('posts.delete')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button--small button--muted"
                onClick={handleStartConversation}
                disabled={isStartingConversation}
              >
                {isStartingConversation ? t('posts.openingChat') : t('posts.messageSeller')}
              </button>
            )}
          </div>

          <section className="seller-card">
            <span className="eyebrow">{t('posts.seller')}</span>
            <h2>{post.user.name}</h2>
            <p>{post.user.bio || t('posts.sellerNoBio')}</p>
            <p>{t('common.memberSince', { date: formatDate(post.user.createdAt) })}</p>
          </section>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t('posts.deleteDialogTitle')}
        description={t('posts.deleteDialogBody')}
        cancelLabel={t('common.cancel')}
        confirmLabel={isDeleting ? t('common.deleting') : t('common.confirm')}
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleDeletePost}
      />
    </article>
  );
};
