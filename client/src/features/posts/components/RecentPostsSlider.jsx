import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/api/client.js';
import { formatCurrency, formatDate } from '../../../lib/utils/format.js';
import { getLocalizedCategoryName } from '../../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../i18n/useI18n.js';

export const RecentPostsSlider = ({ posts }) => {
  const { direction, language, t } = useI18n();
  const trackRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(posts.length > 1);

  const visiblePosts = useMemo(() => posts.slice(0, 6), [posts]);

  const updateScrollState = () => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const normalizedScrollLeft = direction === 'rtl' ? Math.abs(track.scrollLeft) : track.scrollLeft;

    setCanScrollPrev(normalizedScrollLeft > 8);
    setCanScrollNext(normalizedScrollLeft < maxScrollLeft - 8);
  };

  const scrollByCardGroup = (step) => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const amount = Math.max(track.clientWidth * 0.82, 280);
    const nextAmount = step * amount;

    track.scrollBy({
      left: direction === 'rtl' ? -nextAmount : nextAmount,
      behavior: 'smooth'
    });

    window.setTimeout(updateScrollState, 260);
  };

  const PrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const NextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="recent-slider">
      <div className="recent-slider__toolbar">
        <p className="recent-slider__caption">{t('home.viewAllPosts')}</p>

        <div className="recent-slider__actions">
          <button
            type="button"
            className="recent-slider__arrow"
            onClick={() => scrollByCardGroup(-1)}
            disabled={!canScrollPrev}
            aria-label={t('common.previous')}
          >
            <PrevIcon size={18} />
          </button>

          <button
            type="button"
            className="recent-slider__arrow"
            onClick={() => scrollByCardGroup(1)}
            disabled={!canScrollNext}
            aria-label={t('common.next')}
          >
            <NextIcon size={18} />
          </button>
        </div>
      </div>

      <div ref={trackRef} className="recent-slider__track" onScroll={updateScrollState}>
        {visiblePosts.map((post) => {
          const imageUrl = post.primaryImageUrl || post.images?.[0]?.imageUrl;

          return (
            <Link key={post.id} to={`/posts/${post.slug}`} className="recent-slider__card">
              {imageUrl ? (
                <div className="recent-slider__image-wrap">
                  <img
                    src={resolveApiAssetUrl(imageUrl)}
                    alt={post.title}
                    className="recent-slider__image"
                  />
                </div>
              ) : (
                <div className="recent-slider__image-wrap recent-slider__image-wrap--placeholder">
                  <span>{t('posts.noImage')}</span>
                </div>
              )}

              <div className="recent-slider__content">
                <div className="recent-slider__meta">
                  <span>
                    {post.category
                      ? getLocalizedCategoryName(post.category, language)
                      : t('posts.unknownCategory')}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>

                <h3 className="recent-slider__title">{post.title}</h3>

                <p className="recent-slider__location">{post.city || t('common.cityNotSpecified')}</p>

                <strong className="recent-slider__price">{formatCurrency(post.price)}</strong>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
