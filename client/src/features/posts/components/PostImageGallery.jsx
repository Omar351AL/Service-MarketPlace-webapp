import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { resolveApiAssetUrl } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

export const PostImageGallery = ({ images, title }) => {
  const { t } = useI18n();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLightboxOpen]);

  if (!images.length) {
    return <div className="post-card__placeholder post-card__placeholder--large">{t('common.noImageYet')}</div>;
  }

  const safeImageIndex = Math.min(activeImageIndex, images.length - 1);
  const activeImage = images[safeImageIndex] || images[0];
  const activeImageUrl = resolveApiAssetUrl(activeImage.imageUrl);

  const moveToPreviousImage = () =>
    setActiveImageIndex((current) => (current - 1 + images.length) % images.length);

  const moveToNextImage = () =>
    setActiveImageIndex((current) => (current + 1) % images.length);

  return (
    <>
      <div className="post-gallery">
        <div className="post-gallery__hero">
          <button
            type="button"
            className="post-gallery__hero-trigger"
            onClick={() => setIsLightboxOpen(true)}
            aria-label={t('posts.openImageViewer')}
          >
            <img
              key={activeImage.id}
              src={activeImageUrl}
              alt={title}
              className="post-detail__image"
            />
          </button>

          {images.length > 1 ? (
            <div className="post-gallery__controls">
              <button
                type="button"
                className="icon-link"
                onClick={() => {
                  moveToPreviousImage();
                }}
                aria-label={t('common.previous')}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="icon-link"
                onClick={() => {
                  moveToNextImage();
                }}
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

      {isLightboxOpen
        ? createPortal(
            <div
              className="image-lightbox"
              role="presentation"
            >
              <div
                className="image-lightbox__backdrop"
                aria-hidden="true"
                onClick={() => setIsLightboxOpen(false)}
              />
              <div
                className="image-lightbox__content"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="image-lightbox__close"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>

                <img
                  src={activeImageUrl}
                  alt={title}
                  className="image-lightbox__image"
                />

                {images.length > 1 ? (
                  <div className="image-lightbox__controls">
                    <button
                      type="button"
                      className="icon-link"
                      onClick={moveToPreviousImage}
                      aria-label={t('common.previous')}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-link"
                      onClick={moveToNextImage}
                      aria-label={t('common.next')}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};
