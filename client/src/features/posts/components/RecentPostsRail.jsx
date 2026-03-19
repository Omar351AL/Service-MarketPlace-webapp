import { Link } from 'react-router-dom';

import { formatCurrency, formatDate } from '../../../lib/utils/format.js';
import { getLocalizedCategoryName, getLocalizedPostLocation } from '../../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../i18n/useI18n.js';

export const RecentPostsRail = ({ posts }) => {
  const { direction, language, t } = useI18n();
  const limitedPosts = (posts ?? []).slice(0, 5);

  if (!limitedPosts.length) {
    return null;
  }

  const shouldAnimate = limitedPosts.length > 1;
  const displayPosts = direction === 'rtl' ? [...limitedPosts].reverse() : limitedPosts;
  const duration = `${Math.max(displayPosts.length * 5, 18)}s`;

  return (
    <div className="recent-rail" data-direction={direction}>
      <div className="recent-rail__viewport">
        <div
          className={
            shouldAnimate
              ? 'recent-rail__track recent-rail__track--scroll'
              : 'recent-rail__track recent-rail__track--static'
          }
          style={{ '--rail-duration': duration }}
        >
          {[0, ...(shouldAnimate ? [1] : [])].map((groupIndex) => (
            <div
              key={groupIndex}
              className="recent-rail__group"
              aria-hidden={groupIndex === 1 ? 'true' : undefined}
            >
              {displayPosts.map((post) => (
                <Link
                  key={`${post.id}-${groupIndex}`}
                  to={`/posts/${post.slug}`}
                  className="recent-rail__item"
                >
                  <div className="recent-rail__meta">
                    <span>{getLocalizedCategoryName(post.category, language)}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>

                  <strong>{post.title}</strong>

                  <p>{getLocalizedPostLocation(post, language, t)}</p>

                  <span className="recent-rail__price">{formatCurrency(post.price)}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
