const normalizePlatform = (value) => {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'android' || normalized === 'ios') {
    return normalized;
  }

  return null;
};

const resolveRequestedPlatform = (req) => {
  const headerPlatform = req?.headers?.['x-client-platform'];
  const queryPlatform = req?.query?.platform;
  const bodyPlatform = req?.body?.platform;

  return normalizePlatform(headerPlatform || queryPlatform || bodyPlatform);
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractCoursePrices = (course) => {
  const legacyPrice = toNumberOrNull(course?.price) ?? 0;
  const androidPrice = toNumberOrNull(course?.android_price ?? course?.androidPrice);
  const iosPrice = toNumberOrNull(course?.ios_price ?? course?.iosPrice);

  return {
    legacyPrice,
    androidPrice,
    iosPrice,
  };
};

const resolveCoursePrice = (course, platform) => {
  const { legacyPrice, androidPrice, iosPrice } = extractCoursePrices(course);

  if (platform === 'android' && androidPrice !== null) {
    return androidPrice;
  }

  if (platform === 'ios' && iosPrice !== null) {
    return iosPrice;
  }

  return legacyPrice;
};

const toApiCoursePrices = (course, platform) => {
  const { legacyPrice, androidPrice, iosPrice } = extractCoursePrices(course);

  return {
    price: resolveCoursePrice(course, platform),
    androidPrice: androidPrice ?? legacyPrice,
    iosPrice: iosPrice ?? legacyPrice,
  };
};

const buildCoursePricesForCreate = ({ price, androidPrice, iosPrice }) => {
  const parsedPrice = toNumberOrNull(price);
  const parsedAndroid = toNumberOrNull(androidPrice);
  const parsedIOS = toNumberOrNull(iosPrice);

  const legacyPrice = parsedPrice ?? parsedAndroid ?? parsedIOS ?? 0;

  return {
    legacyPrice,
    androidPrice: parsedAndroid ?? parsedPrice ?? legacyPrice,
    iosPrice: parsedIOS ?? parsedPrice ?? legacyPrice,
  };
};

const buildCoursePricesForUpdate = ({ price, androidPrice, iosPrice }, existingCourse) => {
  const existing = extractCoursePrices(existingCourse);
  const parsedPrice = toNumberOrNull(price);
  const parsedAndroid = toNumberOrNull(androidPrice);
  const parsedIOS = toNumberOrNull(iosPrice);

  const legacyPrice = parsedPrice !== null
    ? parsedPrice
    : parsedAndroid !== null
      ? parsedAndroid
      : existing.legacyPrice;

  return {
    legacyPrice,
    androidPrice: parsedAndroid !== null
      ? parsedAndroid
      : parsedPrice !== null
        ? parsedPrice
        : (existing.androidPrice ?? legacyPrice),
    iosPrice: parsedIOS !== null
      ? parsedIOS
      : parsedPrice !== null
        ? parsedPrice
        : (existing.iosPrice ?? legacyPrice),
  };
};

module.exports = {
  normalizePlatform,
  resolveRequestedPlatform,
  extractCoursePrices,
  resolveCoursePrice,
  toApiCoursePrices,
  buildCoursePricesForCreate,
  buildCoursePricesForUpdate,
};
