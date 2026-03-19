import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { PostForm } from '../components/PostForm.jsx';

export const EditPostPage = () => {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { t } = useI18n();
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    Promise.all([api.getCategories(), api.getPost(identifier, token)])
      .then(([categoriesResponse, postResponse]) => {
        setCategories(categoriesResponse.data);
        setPost(postResponse.data);
      })
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [identifier, token]);

  if (isLoading) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('posts.loadingPostTitle')}
          description={t('posts.loadingPostDescription')}
        />
      </div>
    );
  }

  if (!post || categories.length === 0) {
    return (
      <div className="page-stack">
        <EmptyState
          title={t('posts.unableToLoadEditTitle')}
          description={errorMessage || t('posts.unableToLoadEditDescription')}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow={t('posts.editEyebrow')}
        title={t('posts.editTitle')}
        description={t('posts.editDescription')}
      />

      <section className="content-card">
        <PostForm
          categories={categories}
          initialValues={post}
          submitLabel={t('posts.saveAction')}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          fieldErrors={fieldErrors}
          onSubmit={async (payload) => {
            setIsSubmitting(true);
            setErrorMessage('');
            setFieldErrors({});

            try {
              const response = await api.updatePost(identifier, payload, token);
              navigate(`/posts/${response.data.slug}`);
            } catch (error) {
              setFieldErrors(error.fieldErrors || {});
              setErrorMessage(
                Object.keys(error.fieldErrors || {}).length > 0
                  ? t('posts.fixFields')
                  : error.message
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </section>
    </div>
  );
};
