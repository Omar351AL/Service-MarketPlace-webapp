import { ImagePlus, Star, Trash2 } from 'lucide-react';

import { resolveApiAssetUrl } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

export const PostImagePicker = ({
  imageItems,
  coverImageKey,
  onAddImages,
  onSetCover,
  onRemoveImage
}) => {
  const { t } = useI18n();

  return (
    <section className="post-image-picker">
      <div className="section-heading section-heading--compact">
        <div>
          <span className="eyebrow">{t('posts.imagesEyebrow')}</span>
          <h2>{t('posts.imagesTitle')}</h2>
        </div>
      </div>

      <label className="post-image-picker__dropzone">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(event) => {
            onAddImages(event.target.files);
            event.target.value = '';
          }}
        />
        <ImagePlus size={20} />
        <div>
          <strong>{t('posts.addImages')}</strong>
          <p>{t('posts.imageUploadHelp')}</p>
        </div>
      </label>

      {imageItems.length > 0 ? (
        <div className="post-image-picker__grid">
          {imageItems.map((image) => {
            const previewUrl =
              image.previewUrl || resolveApiAssetUrl(image.imageUrl);
            const isCover = image.key === coverImageKey;

            return (
              <article key={image.key} className="post-image-card">
                <img src={previewUrl} alt={t('posts.imagePreviewAlt', { title: image.title || '' })} />

                <div className="post-image-card__body">
                  {isCover ? (
                    <span className="post-image-card__badge">{t('posts.coverImage')}</span>
                  ) : null}

                  <div className="post-image-card__actions">
                    <button
                      type="button"
                      className={isCover ? 'button button--small' : 'button button--small button--muted'}
                      onClick={() => onSetCover(image.key)}
                    >
                      <Star size={16} />
                      {t('posts.setCoverImage')}
                    </button>

                    <button
                      type="button"
                      className="button button--small button--danger"
                      onClick={() => onRemoveImage(image.key)}
                    >
                      <Trash2 size={16} />
                      {t('posts.removeImage')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="post-image-picker__empty">{t('posts.noImagesSelected')}</div>
      )}
    </section>
  );
};
