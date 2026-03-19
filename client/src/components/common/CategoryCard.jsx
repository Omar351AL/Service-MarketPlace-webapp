import { Link } from 'react-router-dom';

import { getCategorySymbol, getLocalizedCategoryName } from '../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../features/i18n/useI18n.js';

export const CategoryCard = ({ category }) => {
  const { language, t } = useI18n();
  const categoryPostCount =
    typeof category._count?.posts === 'number'
      ? t('posts.postsCount', { count: category._count.posts })
      : t('home.categoryShortcut');

  return (
    <Link to={`/browse?category=${category.slug}`} className="category-card">
      <div className="category-card__content">
        <span className="category-card__icon" aria-hidden="true">
          {getCategorySymbol(category)}
        </span>
        <span className="category-card__slug">{t('common.category')}</span>
        <h3>{getLocalizedCategoryName(category, language)}</h3>
        <p>{categoryPostCount}</p>
      </div>
      <span className="category-card__cta">{t('posts.viewUpcomingListings')}</span>
    </Link>
  );
};
