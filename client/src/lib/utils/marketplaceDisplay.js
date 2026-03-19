const CATEGORY_LABELS = {
  vehicles: {
    en: 'Vehicles',
    ar: 'المركبات'
  },
  'real-estate': {
    en: 'Real Estate',
    ar: 'العقارات'
  },
  electronics: {
    en: 'Electronics',
    ar: 'الإلكترونيات'
  },
  'home-garden': {
    en: 'Home & Garden',
    ar: 'المنزل والحديقة'
  },
  fashion: {
    en: 'Fashion',
    ar: 'الأزياء'
  },
  jobs: {
    en: 'Jobs',
    ar: 'الوظائف'
  },
  services: {
    en: 'Services',
    ar: 'الخدمات'
  },
  pets: {
    en: 'Pets',
    ar: 'الحيوانات الأليفة'
  }
};

const POST_STATUS_TRANSLATION_KEYS = {
  ACTIVE: 'status.active',
  SOLD: 'status.sold',
  ARCHIVED: 'status.archived',
  HIDDEN: 'status.hidden'
};

const CATEGORY_SYMBOLS = {
  vehicles: '🚗',
  'real-estate': '🏠',
  electronics: '💻',
  'home-garden': '🪴',
  fashion: '👗',
  jobs: '💼',
  services: '🛠️',
  pets: '🐾'
};

export const getLocalizedCategoryName = (category, language = 'en') => {
  const slug = typeof category === 'string' ? category : category?.slug;
  const fallback =
    typeof category === 'string' ? category : category?.name || category?.slug || '';

  if (!slug) {
    return fallback;
  }

  return CATEGORY_LABELS[slug]?.[language] || fallback;
};

export const getLocalizedPostStatusLabel = (status, t) => {
  const normalizedStatus = String(status || '').toUpperCase();
  const translationKey = POST_STATUS_TRANSLATION_KEYS[normalizedStatus];

  return translationKey ? t(translationKey) : normalizedStatus || '';
};

export const getLocalizedCountryName = (countryCode, language = 'en') => {
  if (!countryCode) {
    return '';
  }

  try {
    const locale = language === 'ar' ? 'ar' : 'en';
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(String(countryCode).toUpperCase()) || String(countryCode).toUpperCase();
  } catch {
    return String(countryCode).toUpperCase();
  }
};

export const getLocalizedPostLocation = (post, language = 'en', t) => {
  const city = post?.city?.trim?.() || '';
  const country = getLocalizedCountryName(post?.country, language);

  if (city && country) {
    return language === 'ar' ? `${city}، ${country}` : `${city}, ${country}`;
  }

  if (city) {
    return city;
  }

  if (country) {
    return country;
  }

  return t ? t('common.locationNotSpecified') : '';
};

export const getCategorySymbol = (category) => {
  const slug = typeof category === 'string' ? category : category?.slug;
  return CATEGORY_SYMBOLS[slug] || '📦';
};
