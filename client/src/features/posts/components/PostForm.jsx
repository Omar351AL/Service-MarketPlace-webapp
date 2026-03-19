import { useEffect, useRef, useState } from 'react';

import { getCityOptions, getCountryOptions } from '../../../lib/utils/locationOptions.js';
import { getLocalizedCategoryName, getLocalizedPostStatusLabel } from '../../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../i18n/useI18n.js';
import { normalizePostPayload, validatePostPayload } from '../utils/postForm.js';
import { PostImagePicker } from './PostImagePicker.jsx';

const defaultValues = {
  title: '',
  description: '',
  price: '',
  country: '',
  city: '',
  categoryId: '',
  status: 'ACTIVE'
};

const toFormState = (initialValues) => ({
  ...defaultValues,
  ...initialValues,
  country: initialValues?.country ? String(initialValues.country).trim().toUpperCase() : '',
  price:
    initialValues?.price === null || initialValues?.price === undefined
      ? ''
      : String(initialValues.price)
});

const getFieldError = (fieldErrors, fieldName) => fieldErrors?.[fieldName]?.[0] || fieldErrors?.[fieldName];
const createImageItems = (images = []) =>
  images.map((image) => ({
    key: `existing:${image.id}`,
    id: image.id,
    imageUrl: image.imageUrl,
    previewUrl: '',
    source: 'existing',
    isPrimary: Boolean(image.isPrimary)
  }));

export const PostForm = ({
  categories,
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  errorMessage,
  fieldErrors = {}
}) => {
  const { language, t } = useI18n();
  const [formState, setFormState] = useState(() => toFormState(initialValues));
  const [localFieldErrors, setLocalFieldErrors] = useState({});
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [imageItems, setImageItems] = useState(() => createImageItems(initialValues?.images));
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [coverImageKey, setCoverImageKey] = useState(() => {
    const existingCover = createImageItems(initialValues?.images).find((image) => image.isPrimary);
    return existingCover?.key || createImageItems(initialValues?.images)[0]?.key || '';
  });
  const imageItemsRef = useRef(imageItems);
  const shouldDisableCitySelect = !formState.country && !formState.city;

  const resolveFieldError = (fieldName) => {
    const message = getFieldError(localFieldErrors, fieldName);
    return message?.includes('.') ? t(message) : message;
  };

  useEffect(() => {
    setImageItems((current) => {
      current
        .filter((image) => image.source === 'new' && image.previewUrl?.startsWith('blob:'))
        .forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return createImageItems(initialValues?.images);
    });
    setRemovedImageIds([]);
    const existingImages = createImageItems(initialValues?.images);
    const existingCover = existingImages.find((image) => image.isPrimary);
    setCoverImageKey(existingCover?.key || existingImages[0]?.key || '');
    setFormState(toFormState(initialValues));
  }, [initialValues]);

  useEffect(() => {
    setLocalFieldErrors(fieldErrors);
  }, [fieldErrors]);

  useEffect(() => {
    imageItemsRef.current = imageItems;
  }, [imageItems]);

  useEffect(
    () => () => {
      imageItemsRef.current
        .filter((image) => image.source === 'new' && image.previewUrl?.startsWith('blob:'))
        .forEach((image) => URL.revokeObjectURL(image.previewUrl));
    },
    []
  );

  useEffect(() => {
    let ignore = false;

    getCountryOptions(language).then((options) => {
      if (!ignore) {
        setCountryOptions(options);
      }
    });

    return () => {
      ignore = true;
    };
  }, [language]);

  useEffect(() => {
    let ignore = false;

    getCityOptions(formState.country).then((options) => {
      if (!ignore) {
        setCityOptions(options);
      }
    });

    return () => {
      ignore = true;
    };
  }, [formState.country]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
      ...(name === 'country' ? { city: '' } : {})
    }));
    setLocalFieldErrors((current) => {
      const relatedField = name === 'country' ? 'city' : null;

      if (!current[name] && (!relatedField || !current[relatedField])) {
        return current;
      }

      return {
        ...current,
        [name]: undefined,
        ...(relatedField ? { [relatedField]: undefined } : {})
      };
    });
  };

  const handleAddImages = (fileList) => {
    const files = Array.from(fileList || []);

    if (!files.length) {
      return;
    }

    setImageItems((current) => {
      const nextItems = [
        ...current,
        ...files.map((file) => ({
          key: `new:${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          source: 'new',
          isPrimary: false
        }))
      ].slice(0, 10);

      if (!coverImageKey && nextItems.length > 0) {
        setCoverImageKey(nextItems[0].key);
      }

      return nextItems;
    });
  };

  const handleRemoveImage = (imageKey) => {
    setImageItems((current) => {
      const imageToRemove = current.find((image) => image.key === imageKey);
      const nextItems = current.filter((image) => image.key !== imageKey);

      if (imageToRemove?.source === 'new' && imageToRemove.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      if (imageToRemove?.source === 'existing' && imageToRemove.id) {
        setRemovedImageIds((existingIds) => [...existingIds, imageToRemove.id]);
      }

      if (coverImageKey === imageKey) {
        setCoverImageKey(nextItems[0]?.key || '');
      }

      return nextItems;
    });
  };

  const buildSubmitPayload = () => {
    const payload = normalizePostPayload(formState);
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    const newImageItems = imageItems.filter((image) => image.source === 'new');

    formData.append('removedImageIds', JSON.stringify(removedImageIds));
    formData.append('newImageKeys', JSON.stringify(newImageItems.map((image) => image.key)));

    if (coverImageKey) {
      formData.append('coverImageKey', coverImageKey);
    }

    newImageItems.forEach((image) => {
      formData.append('images', image.file);
    });

    return { payload, formData };
  };

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();

        const { payload, formData } = buildSubmitPayload();
        const validationErrors = validatePostPayload(payload);

        if (Object.keys(validationErrors).length > 0) {
          setLocalFieldErrors(validationErrors);
          return;
        }

        onSubmit(formData);
      }}
    >
      <div className="editor-grid">
        <label className="field-group">
          <span>{t('form.titleRequired')}</span>
          <input name="title" value={formState.title} onChange={updateField} required />
          {resolveFieldError('title') ? (
            <small className="field-error">{resolveFieldError('title')}</small>
          ) : null}
        </label>

        <label className="field-group">
          <span>{t('form.categoryRequired')}</span>
          <select name="categoryId" value={formState.categoryId} onChange={updateField} required>
            <option value="">{t('form.selectCategory')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {getLocalizedCategoryName(category, language)}
              </option>
            ))}
          </select>
          {resolveFieldError('categoryId') ? (
            <small className="field-error">{resolveFieldError('categoryId')}</small>
          ) : null}
        </label>

        <label className="field-group">
          <span>{t('common.price')}</span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formState.price}
            onChange={updateField}
            placeholder={t('form.pricePlaceholder')}
          />
          {resolveFieldError('price') ? (
            <small className="field-error">{resolveFieldError('price')}</small>
          ) : null}
        </label>

        <label className="field-group">
          <span>{t('common.country')}</span>
          <select name="country" value={formState.country} onChange={updateField}>
            <option value="">{t('form.selectCountry')}</option>
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {resolveFieldError('country') ? (
            <small className="field-error">{resolveFieldError('country')}</small>
          ) : null}
        </label>

        <label className="field-group">
          <span>{t('common.city')}</span>
          <select
            name="city"
            value={formState.city}
            onChange={updateField}
            disabled={shouldDisableCitySelect}
          >
            <option value="">
              {formState.country ? t('form.selectCity') : t('form.selectCountryFirst')}
            </option>
            {!formState.country && formState.city ? (
              <option value={formState.city}>{formState.city}</option>
            ) : null}
            {cityOptions.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
          {resolveFieldError('city') ? (
            <small className="field-error">{resolveFieldError('city')}</small>
          ) : null}
        </label>

        <label className="field-group">
          <span>{t('common.status')}</span>
          <select name="status" value={formState.status} onChange={updateField}>
            <option value="ACTIVE">{getLocalizedPostStatusLabel('ACTIVE', t)}</option>
            <option value="SOLD">{getLocalizedPostStatusLabel('SOLD', t)}</option>
            <option value="ARCHIVED">{getLocalizedPostStatusLabel('ARCHIVED', t)}</option>
          </select>
        </label>
      </div>

      <label className="field-group">
        <span>{t('form.descriptionRequired')}</span>
        <textarea
          name="description"
          value={formState.description}
          onChange={updateField}
          rows={7}
          required
        />
        {resolveFieldError('description') ? (
          <small className="field-error">{resolveFieldError('description')}</small>
        ) : null}
      </label>

      <PostImagePicker
        imageItems={imageItems}
        coverImageKey={coverImageKey}
        onAddImages={handleAddImages}
        onSetCover={setCoverImageKey}
        onRemoveImage={handleRemoveImage}
      />

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="form-actions">
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
};
