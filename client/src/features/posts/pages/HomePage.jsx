import { useEffect, useState } from 'react';

import { CategoryCard } from '../../../components/common/CategoryCard.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { api } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';
import { RecentPostsSlider } from '../components/RecentPostsSlider.jsx';

export const HomePage = () => {
  const { t } = useI18n();

  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [categoriesResponse, postsResponse] = await Promise.all([
          api.getCategories(),
          api.getPosts({ limit: 6 })
        ]);

        if (!ignore) {
          setCategories(categoriesResponse.data ?? []);
          setPosts((postsResponse.data ?? []).slice(0, 6));
          setError('');
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || 'Failed to load home page data.');
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
  }, []);

  return (
    <div className="page-stack">
      <section className="content-card home-hero">
        <div className="home-hero__heading">
          <h1 className="home-hero__title">{t('home.recentTitle')}</h1>
        </div>

        {isLoading ? (
          <LoadingPanel title={t('home.loadingTitle')} description={t('home.loadingDescription')} />
        ) : error ? (
          <EmptyState title={t('home.errorTitle')} description={error} />
        ) : posts.length === 0 ? (
          <EmptyState title={t('home.emptyTitle')} description={t('home.emptyDescription')} />
        ) : (
          <RecentPostsSlider posts={posts} />
        )}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('home.categoriesEyebrow')}</span>
            <h2>{t('home.categoriesTitle')}</h2>
          </div>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
};
