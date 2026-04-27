export type CampType =
  | 'Nature'
  | 'STEM'
  | 'Arts'
  | 'Sports'
  | 'Sailing'
  | 'Academic'
  | 'Music'
  | 'Theater'
  | 'General'
  | 'Technology'
  | 'Swimming'
  | 'Dance'
  | 'Cooking'
  | 'Circus'
  | 'Leadership'
  | string;

export type FinderSort = 'distance' | 'name' | 'cost' | 'current';
export type FinderSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'all';
export type FinderAidFilter = 'yes' | 'known' | 'all';
export type FinderFreshnessFilter = 'current' | 'stale' | 'all';

export interface RawCampRecord {
  camp_name?: unknown;
  organization?: unknown;
  website_url?: unknown;
  address?: unknown;
  neighborhood?: unknown;
  age_range?: unknown;
  camp_type?: unknown;
  hours_of_day?: unknown;
  weeks_available?: unknown;
  cost_per_week?: unknown;
  financial_aid_available?: unknown;
  signup_url?: unknown;
  signup_opens?: unknown;
  data_year?: unknown;
  data_is_stale?: unknown;
  last_scraped?: unknown;
  distance_from_roslindale_miles?: unknown;
}

export interface Camp {
  id: string;
  name: string;
  organization: string;
  type: CampType;
  typeTags: CampType[];
  rawType: string;
  ageRange: string;
  seasons: FinderSeason[];
  neighborhood: string;
  address: string;
  distanceMiles: number | null;
  hoursLabel: string;
  weeksLabel: string;
  costLabel: string;
  financialAidAvailable: boolean | null;
  signupOpensLabel: string;
  dataYear: number | null;
  isStale: boolean;
  lastScrapedAt: string | null;
  websiteUrl: string | null;
  signupUrl: string | null;
}

export interface FinderFilters {
  query: string;
  season: FinderSeason;
  maxDistance: number | null;
  type: CampType | 'all';
  age: number | null;
  savedOnly: boolean;
  sort: FinderSort;
  maxCost: number | null;
  aidFilter: FinderAidFilter;
  freshnessFilter: FinderFreshnessFilter;
  selectedOrg: string | null;
}
