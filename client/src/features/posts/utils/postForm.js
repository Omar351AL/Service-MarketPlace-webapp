export const normalizePostPayload = (formState) => ({
  title: formState.title.trim(),
  description: formState.description.trim(),
  price: formState.price === '' ? undefined : Number(formState.price),
  country: formState.country || undefined,
  city: formState.city.trim() || undefined,
  categoryId: formState.categoryId,
  status: formState.status
});

export const validatePostPayload = (payload) => {
  const fieldErrors = {};

  if (!payload.title) {
    fieldErrors.title = 'form.titleRequiredError';
  } else if (payload.title.length < 4) {
    fieldErrors.title = 'form.titleLengthError';
  } else if (payload.title.length > 120) {
    fieldErrors.title = 'form.titleLongError';
  }

  if (!payload.categoryId) {
    fieldErrors.categoryId = 'form.categoryRequiredError';
  }

  if (!payload.description) {
    fieldErrors.description = 'form.descriptionRequiredError';
  } else if (payload.description.length > 6000) {
    fieldErrors.description = 'form.descriptionLongError';
  }

  if (payload.price !== undefined) {
    if (Number.isNaN(payload.price)) {
      fieldErrors.price = 'form.priceNumberError';
    } else if (payload.price < 0) {
      fieldErrors.price = 'form.priceNegativeError';
    } else if (payload.price > 999999999.99) {
      fieldErrors.price = 'form.priceLargeError';
    }
  }

  if (payload.country && !/^[A-Z]{2}$/.test(payload.country)) {
    fieldErrors.country = 'form.countryInvalidError';
  }

  if (payload.city && payload.city.length > 80) {
    fieldErrors.city = 'form.cityLongError';
  }

  return fieldErrors;
};
