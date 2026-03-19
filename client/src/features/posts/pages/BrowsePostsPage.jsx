import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { api } from '../../../lib/api/client.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { PostCard } from '../components/PostCard.jsx';
import { PostFilters } from '../components/PostFilters.jsx';

export const BrowsePostsPage = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [postPendingDelete, setPostPendingDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const filters = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? ''
  };
  const { q, category } = filters;
  const [searchValue, setSearchValue] = useState(q);
  const hasActiveFilters = Boolean(q || category);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const updateFilters = (nextFilters) => {
    const nextParams = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const [categoriesResponse, postsResponse] = await Promise.all([
          api.getCategories(),
          api.getPosts({
            q,
            category
          })
        ]);

        if (!ignore) {
          setCategories(categoriesResponse.data);
          setPosts(postsResponse.data);
          setMeta(postsResponse.meta);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [category, q]);

  return (
    <div className="page-stack browse-page">
      <section className="content-card browse-toolbar">
        <form
          className="browse-search-row"
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({
              q: searchValue.trim(),
              category
            });
          }}
        >
          <input
            className="browse-search-row__input"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t('filters.keywordPlaceholder')}
            aria-label={t('filters.keyword')}
          />
          <button type="submit" className="browse-search-row__button" aria-label={t('common.search')}>
            <Search size={18} />
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="browse-search-row__clear"
              onClick={() => {
                setSearchValue('');
                setSearchParams(new URLSearchParams());
              }}
              aria-label={t('browse.clearFilters')}
              title={t('browse.clearFilters')}
            >
              <X size={18} />
            </button>
          ) : null}
        </form>

        <div className="browse-toolbar__meta">
          <PostFilters
            categories={categories}
            category={category}
            onCategoryChange={(nextCategory) =>
              updateFilters({
                q,
                category: nextCategory
              })
            }
          />
          {!isLoading && !errorMessage ? (
            <p className="browse-results-total">
              {t('browse.totalResults', { count: meta?.total ?? posts.length })}
            </p>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingPanel title={t('browse.loadingTitle')} description={t('browse.loadingDescription')} />
      ) : errorMessage ? (
        <EmptyState title={t('browse.errorTitle')} description={errorMessage} />
      ) : posts.length === 0 ? (
        <EmptyState
          title={t('browse.emptyTitle')}
          description={t('browse.emptyDescription')}
        />
      ) : (
        <section className="posts-grid posts-grid--browse">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={setPostPendingDelete} variant="browse" />
          ))}
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
            setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postPendingDelete.id));
            setMeta((currentMeta) =>
              currentMeta
                ? {
                    ...currentMeta,
                    total: Math.max((currentMeta.total ?? 1) - 1, 0)
                  }
                : currentMeta
            );
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
