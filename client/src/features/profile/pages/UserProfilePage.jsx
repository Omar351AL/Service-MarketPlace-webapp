import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { api, resolveApiAssetUrl } from '../../../lib/api/client.js';
import { formatDate, formatNumber } from '../../../lib/utils/format.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { PostCard } from '../../posts/components/PostCard.jsx';

export const UserProfilePage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { isAuthenticated, token, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [postPendingDelete, setPostPendingDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  useEffect(() => {
    let ignore = false;

    api
      .getPublicProfile(userId, token)
      .then((response) => {
        if (!ignore) {
          setProfile(response.data);
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
  }, [token, userId]);

  if (!profile && !errorMessage) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('common.loading')}
          description={t('profile.listingsTitle')}
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="page-stack">
        <EmptyState title={t('profile.updateErrorTitle')} description={errorMessage} />
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const avatarUrl = profile.avatarUrl ? resolveApiAssetUrl(profile.avatarUrl) : '';
  const initials = (profile.name || '?').trim().charAt(0).toUpperCase();

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }

    if (isOwnProfile) {
      return;
    }

    setIsStartingConversation(true);
    setErrorMessage('');

    try {
      const response = await api.createConversation(
        {
          participantUserId: profile.id
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
    <div className="page-stack profile-page">
      <section className="content-card profile-hero">
        <div className="profile-hero__main">
          <div className="profile-hero__avatar-wrap">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="profile-hero__avatar"
              />
            ) : (
              <div className="profile-hero__avatar-fallback">{initials}</div>
            )}
          </div>

          <div className="profile-hero__content">
            <span className="eyebrow">{t('profile.sellerEyebrow')}</span>
            <h1 className="profile-hero__name">{profile.name}</h1>
            <p className="profile-hero__bio">{profile.bio || t('profile.noBio')}</p>
          </div>
        </div>

        <div className="profile-hero__actions">
          {isOwnProfile ? (
            <>
              <Link to="/account" className="button button--small button--muted">
                {t('nav.accountSettings')}
              </Link>
              <Link to="/create-post" className="button button--small">
                {t('nav.myPosts')}
              </Link>
              <Link to="/messages" className="button button--small button--muted">
                {t('nav.inbox')}
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="button"
              onClick={handleStartConversation}
              disabled={isStartingConversation}
            >
              {isStartingConversation ? t('posts.openingChat') : t('profile.messageUser')}
            </button>
          )}
        </div>
      </section>

      <section className="content-card profile-stats">
        <div className="profile-stats__grid">
          <div className="profile-stat-card">
            <span className="eyebrow">{t('profile.memberSinceLabel')}</span>
            <strong className="profile-stat-card__value">{formatDate(profile.createdAt)}</strong>
          </div>

          <div className="profile-stat-card">
            <span className="eyebrow">{t('profile.publicPosts')}</span>
            <strong className="profile-stat-card__value">{formatNumber(profile.posts.length)}</strong>
          </div>
        </div>
      </section>

      {profile.posts.length === 0 ? (
        <EmptyState
          title={t('profile.noPublicPostsTitle')}
          description={t('profile.noPublicPostsDescription')}
        />
      ) : (
        <section className="content-card profile-listings">
          <div className="section-heading profile-listings__heading">
            <div>
              <span className="eyebrow">{t('profile.listingsEyebrow')}</span>
              <h2>{t('profile.listingsTitle')}</h2>
            </div>
          </div>

          <div className="posts-grid">
            {profile.posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  user: {
                    id: profile.id,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl
                  }
                }}
                onDelete={isOwnProfile ? setPostPendingDelete : undefined}
              />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={Boolean(postPendingDelete)}
        title={t('posts.deleteDialogTitle')}
        description={t('posts.deleteDialogBody')}
        cancelLabel={t('common.cancel')}
        confirmLabel={isDeletingPost ? t('common.deleting') : t('common.confirm')}
        isConfirming={isDeletingPost}
        onCancel={() => {
          if (!isDeletingPost) {
            setPostPendingDelete(null);
          }
        }}
        onConfirm={async () => {
          if (!postPendingDelete) {
            return;
          }

          try {
            setIsDeletingPost(true);
            setErrorMessage('');
            await api.deletePost(postPendingDelete.slug, token);
            setProfile((currentProfile) => ({
              ...currentProfile,
              posts: currentProfile.posts.filter((post) => post.id !== postPendingDelete.id)
            }));
            setPostPendingDelete(null);
          } catch (error) {
            setErrorMessage(error.message);
          } finally {
            setIsDeletingPost(false);
          }
        }}
      />
    </div>
  );
};
