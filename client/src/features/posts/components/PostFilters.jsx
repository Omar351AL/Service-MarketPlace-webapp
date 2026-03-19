import { getLocalizedCategoryName } from '../../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../i18n/useI18n.js';

export const PostFilters = ({ categories, category, onCategoryChange }) => {
  const { language, t } = useI18n();

  return (
    <div className="browse-filter-row">
      <label className="browse-filter-row__group">
        <select
          name="category"
          value={category}
          onChange={(event) => onCategoryChange?.(event.target.value)}
          aria-label={t('common.category')}
        >
          <option value="">{t('filters.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {getLocalizedCategoryName(category, language)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
