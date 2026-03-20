let locationStorePromise;

const countryDisplayCache = new Map();
const countryOptionsCache = new Map();
const cityOptionsCache = new Map();

const arabicCityOverrides = new Map([
  ['damascus', 'دمشق'],
  ['aleppo', 'حلب'],
  ['homs', 'حمص'],
  ['hama', 'حماة'],
  ['latakia', 'اللاذقية'],
  ['tartus', 'طرطوس'],
  ['deir ez-zor', 'دير الزور'],
  ['deir ezzor', 'دير الزور'],
  ['raqqa', 'الرقة'],
  ['al hasakah', 'الحسكة'],
  ['hasakah', 'الحسكة'],
  ['daraa', 'درعا'],
  ['as suwayda', 'السويداء'],
  ['suwayda', 'السويداء'],
  ['idlib', 'إدلب'],
  ['qamishli', 'القامشلي'],
  ['jaramana', 'جرمانا'],
  ['amman', 'عمان'],
  ['zarqa', 'الزرقاء'],
  ['irbid', 'إربد'],
  ['aqaba', 'العقبة'],
  ['mafraq', 'المفرق'],
  ['salt', 'السلط'],
  ['madaba', 'مادبا'],
  ['jerash', 'جرش'],
  ['karak', 'الكرك'],
  ['tafilah', 'الطفيلة'],
  ['maan', 'معان'],
  ['riyadh', 'الرياض'],
  ['jeddah', 'جدة'],
  ['mecca', 'مكة'],
  ['makkah', 'مكة'],
  ['medina', 'المدينة'],
  ['madinah', 'المدينة'],
  ['dammam', 'الدمام'],
  ['khobar', 'الخبر'],
  ['taif', 'الطائف'],
  ['abha', 'أبها'],
  ['tabuk', 'تبوك'],
  ['hail', 'حائل'],
  ['najran', 'نجران'],
  ['buraidah', 'بريدة'],
  ['yanbu', 'ينبع'],
  ['khamis mushait', 'خميس مشيط'],
  ['cairo', 'القاهرة'],
  ['alexandria', 'الإسكندرية'],
  ['giza', 'الجيزة'],
  ['dubai', 'دبي'],
  ['abu dhabi', 'أبوظبي'],
  ['sharjah', 'الشارقة'],
  ['ajman', 'عجمان'],
  ['al ain', 'العين'],
  ['doha', 'الدوحة'],
  ['kuwait city', 'مدينة الكويت'],
  ['manama', 'المنامة'],
  ['beirut', 'بيروت'],
  ['tripoli', 'طرابلس'],
  ['sidon', 'صيدا'],
  ['tyre', 'صور'],
  ['nablus', 'نابلس'],
  ['ramallah', 'رام الله'],
  ['jerusalem', 'القدس'],
  ['gaza', 'غزة'],
  ['istanbul', 'إسطنبول'],
  ['ankara', 'أنقرة'],
  ['izmir', 'إزمير']
]);

const arabicWordOverrides = new Map([
  ['district', 'منطقة'],
  ['governorate', 'محافظة'],
  ['province', 'مقاطعة'],
  ['county', 'مقاطعة'],
  ['municipality', 'بلدية'],
  ['city', 'مدينة'],
  ['town', 'بلدة'],
  ['village', 'قرية'],
  ['new', 'الجديدة'],
  ['old', 'القديمة'],
  ['north', 'الشمالية'],
  ['south', 'الجنوبية'],
  ['east', 'الشرقية'],
  ['west', 'الغربية'],
  ['central', 'الوسطى'],
  ['upper', 'العليا'],
  ['lower', 'السفلى']
]);

const transliterationChunks = [
  ['sh', 'ش'],
  ['kh', 'خ'],
  ['th', 'ث'],
  ['dh', 'ذ'],
  ['gh', 'غ'],
  ['ch', 'تش'],
  ['ph', 'ف'],
  ['ou', 'و'],
  ['oo', 'و'],
  ['ee', 'ي'],
  ['aa', 'ا'],
  ['ai', 'اي'],
  ['ei', 'ي']
];

const transliterationChars = {
  a: 'ا',
  b: 'ب',
  c: 'ك',
  d: 'د',
  e: 'ي',
  f: 'ف',
  g: 'ج',
  h: 'ه',
  i: 'ي',
  j: 'ج',
  k: 'ك',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'و',
  p: 'ب',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'و',
  v: 'ف',
  w: 'و',
  x: 'كس',
  y: 'ي',
  z: 'ز'
};

const normalizeLocationKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const hasArabicCharacters = (value) => /[\u0600-\u06FF]/.test(value);

const getCountryDisplayNames = (language) => {
  if (!countryDisplayCache.has(language)) {
    countryDisplayCache.set(
      language,
      new Intl.DisplayNames([language === 'ar' ? 'ar' : 'en'], { type: 'region' })
    );
  }

  return countryDisplayCache.get(language);
};

const transliterateWordToArabic = (word) => {
  let result = normalizeLocationKey(word);

  transliterationChunks.forEach(([from, to]) => {
    result = result.replaceAll(from, to);
  });

  result = [...result]
    .map((character) => {
      if (character === ' ' || character === '-') {
        return ' ';
      }

      return transliterationChars[character] ?? character;
    })
    .join('');

  return result.replace(/\s+/g, ' ').trim();
};

const localizeCityLabel = (cityName, language) => {
  if (language !== 'ar' || !cityName) {
    return cityName;
  }

  if (hasArabicCharacters(cityName)) {
    return cityName;
  }

  const normalizedKey = normalizeLocationKey(cityName);
  const directOverride = arabicCityOverrides.get(normalizedKey);

  if (directOverride) {
    return directOverride;
  }

  return normalizedKey
    .split(/[\s-]+/)
    .map((word) => arabicWordOverrides.get(word) || transliterateWordToArabic(word))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildLocationStore = async () => {
  const { City, Country } = await import('country-state-city');
  const citiesByCountry = new Map();

  Country.getAllCountries().forEach((country) => {
    const dedupedCities = new Map();

    for (const city of City.getCitiesOfCountry(country.isoCode) || []) {
      const normalizedKey = normalizeLocationKey(city.name);

      if (!dedupedCities.has(normalizedKey)) {
        dedupedCities.set(normalizedKey, {
          value: city.name,
          name: city.name
        });
      }
    }

    citiesByCountry.set(country.isoCode, [...dedupedCities.values()]);
  });

  return {
    countries: Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      name: country.name
    })),
    citiesByCountry
  };
};

export const loadLocationStore = async () => {
  if (!locationStorePromise) {
    locationStorePromise = buildLocationStore();
  }

  return locationStorePromise;
};

export const getCountryOptions = (locationStore, language = 'en') => {
  const cacheKey = `${language}`;

  if (!countryOptionsCache.has(cacheKey)) {
    const displayNames = getCountryDisplayNames(language);
    const localizedOptions = locationStore.countries
      .map((country) => ({
        value: country.value,
        label: displayNames.of(country.value) || country.name
      }))
      .sort((left, right) => left.label.localeCompare(right.label, language));

    countryOptionsCache.set(cacheKey, localizedOptions);
  }

  return countryOptionsCache.get(cacheKey);
};

export const getCityOptions = (locationStore, countryCode, language = 'en') => {
  if (!countryCode) {
    return [];
  }

  const cacheKey = `${language}:${countryCode}`;

  if (!cityOptionsCache.has(cacheKey)) {
    const localizedCities = (locationStore.citiesByCountry.get(countryCode) || [])
      .map((city) => ({
        value: city.value,
        label: localizeCityLabel(city.name, language)
      }))
      .sort((left, right) => left.label.localeCompare(right.label, language));

    cityOptionsCache.set(cacheKey, localizedCities);
  }

  return cityOptionsCache.get(cacheKey);
};

void loadLocationStore();
