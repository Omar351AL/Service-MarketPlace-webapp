let locationLibraryPromise;

const countryDisplayCache = new Map();

const loadLocationLibrary = async () => {
  if (!locationLibraryPromise) {
    locationLibraryPromise = import('country-state-city');
  }

  return locationLibraryPromise;
};

const getCountryDisplayNames = (language) => {
  if (!countryDisplayCache.has(language)) {
    const locale = language === 'ar' ? 'ar' : 'en';
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    countryDisplayCache.set(language, displayNames);
  }

  return countryDisplayCache.get(language);
};

export const getCountryOptions = async (language = 'en') => {
  const { Country } = await loadLocationLibrary();
  const displayNames = getCountryDisplayNames(language);

  return Country.getAllCountries()
    .map((country) => ({
      value: country.isoCode,
      label: displayNames.of(country.isoCode) || country.name
    }))
    .sort((left, right) => left.label.localeCompare(right.label, language));
};

export const getCityOptions = async (countryCode) => {
  if (!countryCode) {
    return [];
  }

  const { City } = await loadLocationLibrary();
  const dedupedCities = new Map();

  for (const city of City.getCitiesOfCountry(countryCode) || []) {
    if (!dedupedCities.has(city.name)) {
      dedupedCities.set(city.name, {
        value: city.name,
        label: city.name
      });
    }
  }

  return [...dedupedCities.values()].sort((left, right) => left.label.localeCompare(right.label));
};
