import type { Camp, FinderSeason, RawCampRecord } from '../../features/finder/types';

const SEASON_PATTERNS: Array<[FinderSeason, RegExp]> = [
  ['spring', /\b(spring|march|april|may)\b/i],
  ['summer', /\b(summer|june|july|august)\b/i],
  ['fall', /\b(fall|autumn|september|october|november)\b/i],
  ['winter', /\b(winter|december|january|february)\b/i],
];

function toTrimmedString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function toNullableString(value: unknown): string | null {
  const text = toTrimmedString(value);
  return text === '' ? null : text;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function toId(name: string, organization: string): string {
  const base = `${organization}-${name}`.trim();

  return (base || 'camp')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pushTypeTag(typeTags: Camp['typeTags'], tag: Camp['type']): void {
  if (!typeTags.includes(tag)) {
    typeTags.push(tag);
  }
}

function canonicalizeCampType(
  value: unknown,
): { type: Camp['type']; typeTags: Camp['typeTags']; rawType: string } {
  const rawType = toTrimmedString(value);
  const normalized = rawType.toLowerCase();
  const typeTags: Camp['typeTags'] = [];

  if (normalized === '') {
    return { type: 'General', typeTags: ['General'], rawType };
  }

  if (normalized.includes('sailing')) {
    pushTypeTag(typeTags, 'Sailing');
  }

  if (normalized.includes('stem') || normalized.includes('technology')) {
    pushTypeTag(typeTags, 'STEM');
  }

  if (
    normalized.includes('arts') ||
    normalized.includes('art') ||
    normalized.includes('culture')
  ) {
    pushTypeTag(typeTags, 'Arts');
  }

  if (normalized.includes('sports') || normalized.includes('tennis')) {
    pushTypeTag(typeTags, 'Sports');
  }

  if (normalized.includes('nature') || normalized.includes('animal')) {
    pushTypeTag(typeTags, 'Nature');
  }

  if (normalized.includes('music')) {
    pushTypeTag(typeTags, 'Music');
  }

  if (normalized.includes('circus')) {
    pushTypeTag(typeTags, 'Circus');
  }

  if (normalized.includes('leadership')) {
    pushTypeTag(typeTags, 'Leadership');
  }

  if (normalized.includes('general')) {
    pushTypeTag(typeTags, 'General');
  }

  if (typeTags.length > 0) {
    return { type: typeTags[0], typeTags, rawType };
  }

  return { type: rawType, typeTags: [rawType], rawType };
}

export function inferSeasons(value: unknown): FinderSeason[] {
  const text = toTrimmedString(value);

  if (text === '') {
    return ['all'];
  }

  const seasons = SEASON_PATTERNS.flatMap(([season, pattern]) =>
    pattern.test(text) ? [season] : [],
  );

  return seasons.length > 0 ? seasons : ['all'];
}

export function normalizeCamp(raw: RawCampRecord): Camp {
  const name = toTrimmedString(raw.camp_name);
  const organization = toTrimmedString(raw.organization);
  const { type, typeTags, rawType } = canonicalizeCampType(raw.camp_type);

  return {
    id: toId(name, organization),
    name,
    organization,
    type,
    typeTags,
    rawType,
    ageRange: toTrimmedString(raw.age_range),
    seasons: inferSeasons(raw.weeks_available),
    neighborhood: toTrimmedString(raw.neighborhood),
    address: toTrimmedString(raw.address),
    distanceMiles: toNullableNumber(raw.distance_from_roslindale_miles),
    hoursLabel: toTrimmedString(raw.hours_of_day),
    weeksLabel: toTrimmedString(raw.weeks_available),
    costLabel: toTrimmedString(raw.cost_per_week),
    financialAidAvailable: toNullableBoolean(raw.financial_aid_available),
    signupOpensLabel: toTrimmedString(raw.signup_opens),
    dataYear:
      typeof raw.data_year === 'number' && Number.isFinite(raw.data_year)
        ? raw.data_year
        : null,
    isStale: Boolean(raw.data_is_stale),
    lastScrapedAt: toNullableString(raw.last_scraped),
    websiteUrl: toNullableString(raw.website_url),
    signupUrl: toNullableString(raw.signup_url),
  };
}
