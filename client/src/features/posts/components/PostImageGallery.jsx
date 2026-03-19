import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { resolveApiAssetUrl } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

export const PostImageGallery = ({ images, title }) => {
  const { t } = useI18n();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!images.length) {
    return <div className="post-card__placeholder post-card__placeholder--large">{t('common.noImageYet')}</div>;
  }

  const safeImageIndex = Math.min(activeImageIndex, images.length - 1);
  const activeImage = images[safeImageIndex] || images[0];

  return (
    <div className="post-gallery">
      <div className="post-gallery__hero">
        <img
          key={activeImage.id}
          src={resolveApiAssetUrl(activeImage.imageUrl)}
          alt={title}
          className="post-detail__image"
        />

        {images.length > 1 ? (
          <div className="post-gallery__controls">
            <button
              type="button"
              className="icon-link"
              onClick={() =>
                setActiveImageIndex((current) => (current - 1 + images.length) % images.length)
              }
              aria-label={t('common.previous')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="icon-link"
              onClick={() => setActiveImageIndex((current) => (current + 1) % images.length)}
              aria-label={t('common.next')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="post-gallery__thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={
                index === safeImageIndex
                  ? 'post-gallery__thumb post-gallery__thumb--active'
                  : 'post-gallery__thumb'
              }
              onClick={() => setActiveImageIndex(index)}
            >
              <img src={resolveApiAssetUrl(image.imageUrl)} alt={title} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
