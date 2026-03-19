export const toEnglishDigits = (value) =>
  String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const getLocale = () =>
  typeof document !== 'undefined' && document.documentElement.lang === 'ar'
    ? 'ar-SA-u-nu-latn'
    : 'en-US-u-nu-latn';

const getStaticLabel = (key) => {
  const isArabic =
    typeof document !== 'undefined' && document.documentElement.lang === 'ar';

  const labels = {
    priceOnRequest: isArabic ? 'السعر عند الطلب' : 'Price on request',
    noMessagesYet: isArabic ? 'لا توجد رسائل بعد' : 'No messages yet'
  };

  return labels[key];
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return getStaticLabel('priceOnRequest');
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return getStaticLabel('priceOnRequest');
  }

  return toEnglishDigits(
    new Intl.NumberFormat(getLocale(), {
      numberingSystem: 'latn',
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numericValue)
  );
};

export const formatNumber = (value, options = {}) =>
  toEnglishDigits(
    new Intl.NumberFormat(getLocale(), {
      numberingSystem: 'latn',
      maximumFractionDigits: 0,
      ...options
    }).format(Number(value ?? 0))
  );

export const formatDate = (value) =>
  toEnglishDigits(
    new Intl.DateTimeFormat(getLocale(), {
      numberingSystem: 'latn',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value))
  );

export const formatDateTime = (value) =>
  toEnglishDigits(
    new Intl.DateTimeFormat(getLocale(), {
      numberingSystem: 'latn',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value))
  );

export const formatTime = (value) =>
  toEnglishDigits(
    new Intl.DateTimeFormat(getLocale(), {
      numberingSystem: 'latn',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value))
  );

export const formatConversationTimestamp = (value) => {
  if (!value) {
    return getStaticLabel('noMessagesYet');
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return isSameDay ? formatTime(date) : formatDate(date);
};
