let locationStorePromise;

const countryDisplayCache = new Map();
const countryOptionsCache = new Map();
const governorateOptionsCache = new Map();

const arabicGovernorateOverrides = new Map([
  ['al-hasakah governorate', 'محافظة الحسكة'],
  ['al-raqqah governorate', 'محافظة الرقة'],
  ['aleppo governorate', 'محافظة حلب'],
  ['as-suwayda governorate', 'محافظة السويداء'],
  ['damascus governorate', 'محافظة دمشق'],
  ['daraa governorate', 'محافظة درعا'],
  ['deir ez-zor governorate', 'محافظة دير الزور'],
  ['hama governorate', 'محافظة حماة'],
  ['homs governorate', 'محافظة حمص'],
  ['idlib governorate', 'محافظة إدلب'],
  ['latakia governorate', 'محافظة اللاذقية'],
  ['quneitra governorate', 'محافظة القنيطرة'],
  ['rif dimashq governorate', 'محافظة ريف دمشق'],
  ['tartus governorate', 'محافظة طرطوس'],
  ['ajloun governorate', 'محافظة عجلون'],
  ['amman governorate', 'محافظة عمّان'],
  ['aqaba governorate', 'محافظة العقبة'],
  ['balqa governorate', 'محافظة البلقاء'],
  ['irbid governorate', 'محافظة إربد'],
  ['jerash governorate', 'محافظة جرش'],
  ['karak governorate', 'محافظة الكرك'],
  ["ma'an governorate", 'محافظة معان'],
  ['madaba governorate', 'محافظة مادبا'],
  ['mafraq governorate', 'محافظة المفرق'],
  ['tafilah governorate', 'محافظة الطفيلة'],
  ['zarqa governorate', 'محافظة الزرقاء'],
  ["'asir", 'عسير'],
  ['al bahah', 'الباحة'],
  ['al jawf', 'الجوف'],
  ['al madinah', 'المدينة المنورة'],
  ['al-qassim', 'القصيم'],
  ['eastern province', 'المنطقة الشرقية'],
  ["ha'il", 'حائل'],
  ['jizan', 'جازان'],
  ['makkah', 'مكة المكرمة'],
  ['najran', 'نجران'],
  ['northern borders', 'الحدود الشمالية'],
  ['riyadh', 'الرياض'],
  ['tabuk', 'تبوك'],
  ['amman', 'عمّان'],
  ['beirut governorate', 'محافظة بيروت'],
  ['mount lebanon governorate', 'محافظة جبل لبنان'],
  ['dubai', 'دبي'],
  ['abu dhabi', 'أبوظبي'],
  ['sharjah', 'الشارقة'],
  ['doha', 'الدوحة'],
  ['cairo governorate', 'محافظة القاهرة'],
  ['alexandria governorate', 'محافظة الإسكندرية']
]);

const arabicWordOverrides = new Map([
  ['governorate', 'محافظة'],
  ['province', 'منطقة'],
  ['region', 'منطقة'],
  ['district', 'منطقة'],
  ['state', 'ولاية'],
  ['county', 'مقاطعة'],
  ['territory', 'إقليم'],
  ['north', 'الشمالية'],
  ['south', 'الجنوبية'],
  ['east', 'الشرقية'],
  ['west', 'الغربية'],
  ['central', 'الوسطى'],
  ['upper', 'العليا'],
  ['lower', 'السفلى'],
  ['mount', 'جبل'],
  ['mountain', 'جبل'],
  ['borders', 'الحدود'],
  ['eastern', 'الشرقية'],
  ['western', 'الغربية'],
  ['northern', 'الشمالية'],
  ['southern', 'الجنوبية']
]);

const transliterationChunks = [
  ['sh', 'ش'],
  ['kh', 'خ'],
  ['th', 'ث'],
  ['dh', 'ذ'],
  ['gh', 'غ'],
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
    .replace(/[’']/g, "'")
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

const localizeGovernorateLabel = (name, language) => {
  if (language !== 'ar' || !name) {
    return name;
  }

  if (hasArabicCharacters(name)) {
    return name;
  }

  const normalizedKey = normalizeLocationKey(name);
  const directOverride = arabicGovernorateOverrides.get(normalizedKey);

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
  const { Country, State } = await import('country-state-city');
  const governoratesByCountry = new Map();

  Country.getAllCountries().forEach((country) => {
    const dedupedGovernorates = new Map();

    for (const subdivision of State.getStatesOfCountry(country.isoCode) || []) {
      const normalizedKey = normalizeLocationKey(subdivision.name);

      if (!dedupedGovernorates.has(normalizedKey)) {
        dedupedGovernorates.set(normalizedKey, {
          value: subdivision.name,
          name: subdivision.name,
          code: subdivision.isoCode
        });
      }
    }

    governoratesByCountry.set(country.isoCode, [...dedupedGovernorates.values()]);
  });

  return {
    countries: Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      name: country.name
    })),
    governoratesByCountry
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

export const getGovernorateOptions = (locationStore, countryCode, language = 'en') => {
  if (!countryCode) {
    return [];
  }

  const cacheKey = `${language}:${countryCode}`;

  if (!governorateOptionsCache.has(cacheKey)) {
    const localizedGovernorates = (locationStore.governoratesByCountry.get(countryCode) || [])
      .map((governorate) => ({
        value: governorate.value,
        label: localizeGovernorateLabel(governorate.name, language)
      }))
      .sort((left, right) => left.label.localeCompare(right.label, language));

    governorateOptionsCache.set(cacheKey, localizedGovernorates);
  }

  return governorateOptionsCache.get(cacheKey);
};

void loadLocationStore();
