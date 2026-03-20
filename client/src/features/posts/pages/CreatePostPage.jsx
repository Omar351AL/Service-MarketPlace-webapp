import { useEffect, useState } from 'react';
import { PlusSquare } from 'lucide-react';

import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { PostCard } from '../components/PostCard.jsx';
import { PostForm } from '../components/PostForm.jsx';

export const CreatePostPage = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [postPendingDelete, setPostPendingDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(null);
  const [submitProgressLabel, setSubmitProgressLabel] = useState('');

  const loadData = async () => {
    try {
      const [categoriesResponse, postsResponse] = await Promise.all([
        api.getCategories(),
        api.getMyPosts(token)
      ]);

      setCategories(categoriesResponse.data);
      setPosts(postsResponse.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      try {
        const [categoriesResponse, postsResponse] = await Promise.all([
          api.getCategories(),
          api.getMyPosts(token)
        ]);

        if (ignore) {
          return;
        }

        setCategories(categoriesResponse.data);
        setPosts(postsResponse.data);
        setErrorMessage('');
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message);
          setPosts([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('posts.myLoadingTitle')}
          description={t('posts.myLoadingDescription')}
        />
      </div>
    );
  }

  return (
    <div className="page-stack manage-listings-page">
      <PageIntro
        eyebrow={t('posts.manageEyebrow')}
        title={t('posts.manageTitle')}
        description={null}
        layout="split"
        actions={
          <button
            type="button"
            className="button manage-listings__primary-action"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setActionMessage('');
              setErrorMessage('');
              setFieldErrors({});
              setSubmitProgress(null);
              setSubmitProgressLabel('');
            }}
          >
            <PlusSquare size={18} />
            {t('posts.addNewListing')}
          </button>
        }
      />

      {showCreateForm ? (
        <section className="content-card manage-listings__composer">
          <div className="section-heading">
          <div>
            <span className="eyebrow">{t('posts.createEyebrow')}</span>
            <h2>{t('posts.addNewListing')}</h2>
            <p>{t('posts.createDescription')}</p>
          </div>
          </div>

          <PostForm
            categories={categories}
            submitLabel={t('posts.addNewListing')}
            isSubmitting={isSubmitting}
            submitProgress={submitProgress}
            submitProgressLabel={submitProgressLabel}
            errorMessage={errorMessage}
            fieldErrors={fieldErrors}
            onSubmit={async (payload) => {
              const hasImages = payload.getAll('images').length > 0;

              setIsSubmitting(true);
              setErrorMessage('');
              setFieldErrors({});
              setActionMessage('');
              setSubmitProgress(hasImages ? 0 : null);
              setSubmitProgressLabel(hasImages ? t('posts.uploadingImages') : '');

              try {
                const response = await api.createPost(payload, token, {
                  timeoutMs: 120000,
                  onUploadProgress: (progressValue) => {
                    setSubmitProgress(progressValue);
                    setSubmitProgressLabel(t('posts.uploadingImages'));
                  },
                  onUploadStageChange: (stage) => {
                    if (!hasImages) {
                      return;
                    }

                    if (stage === 'processing') {
                      setSubmitProgress(100);
                      setSubmitProgressLabel(t('posts.savingListing'));
                    }
                  }
                });
                setPosts((currentPosts) =>
                  currentPosts ? [response.data, ...currentPosts] : [response.data]
                );
                setShowCreateForm(false);
                setActionMessage(t('posts.createSuccess'));
              } catch (error) {
                setFieldErrors(error.fieldErrors || {});
                setErrorMessage(
                  Object.keys(error.fieldErrors || {}).length > 0
                    ? t('posts.fixFields')
                    : error.code === 'UPLOAD_TIMEOUT'
                      ? t('posts.uploadTimeoutError')
                      : error.code === 'NETWORK_ERROR'
                        ? t('posts.uploadNetworkError')
                        : error.message
                );
              } finally {
                setIsSubmitting(false);
                setSubmitProgress(null);
                setSubmitProgressLabel('');
              }
            }}
          />
        </section>
      ) : null}

      {errorMessage && posts?.length === 0 ? <p className="error-message">{errorMessage}</p> : null}
      {actionMessage ? <p className="success-message">{actionMessage}</p> : null}

      {posts?.length === 0 ? (
        <EmptyState
          title={t('posts.myEmptyTitle')}
          description={null}
        />
      ) : (
        <section className="content-card manage-listings__collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('posts.myEyebrow')}</span>
              <h2>{t('posts.manageCollectionTitle')}</h2>
              <p>{t('posts.manageCollectionDescription')}</p>
            </div>
          </div>

          <div className="posts-grid posts-grid--manage">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showActions
                variant="manage"
                onDelete={setPostPendingDelete}
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
            setActionMessage(t('posts.deleteSuccess'));
            setPostPendingDelete(null);
            await loadData();
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
