import type {
  CampType,
  FinderFilters,
  FinderSeason,
  FinderSort,
} from '../../features/finder/types';

export const DEFAULT_FINDER_FILTERS: FinderFilters = {
  query: '',
  season: 'all',
  maxDistance: null,
  type: 'all',
  age: null,
  savedOnly: false,
  sort: 'distance',
};

export interface FinderShareState {
  filters: FinderFilters;
  selectedCampId: string | null;
}

function parseNullableNumber(value: string | null): number | null {
  if (value == null || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string | null): boolean {
  return value === '1' || value === 'true';
}

function isFinderSeason(value: string | null): value is FinderSeason {
  return value === 'spring' || value === 'summer' || value === 'fall' || value === 'winter';
}

function isFinderSort(value: string | null): value is FinderSort {
  return value === 'distance' || value === 'name' || value === 'cost' || value === 'current';
}

function normalizeSearch(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function readType(value: string | null): CampType | 'all' {
  if (value == null || value.trim() === '' || value === 'all') {
    return 'all';
  }

  return value as CampType;
}

export function parseFinderShareState(search: string): FinderShareState {
  const params = normalizeSearch(search);
  const seasonParam = params.get('season');
  const sortParam = params.get('sort');

  return {
    filters: {
      query: params.get('q')?.trim() ?? DEFAULT_FINDER_FILTERS.query,
      season: isFinderSeason(seasonParam) ? seasonParam : DEFAULT_FINDER_FILTERS.season,
      maxDistance: parseNullableNumber(params.get('maxDistance')),
      type: readType(params.get('type')),
      age: parseNullableNumber(params.get('age')),
      savedOnly: parseBoolean(params.get('savedOnly')),
      sort: isFinderSort(sortParam) ? sortParam : DEFAULT_FINDER_FILTERS.sort,
    },
    selectedCampId: params.get('selected')?.trim() || null,
  };
}

export function stringifyFinderShareState(state: FinderShareState): string {
  const params = new URLSearchParams();
  const { filters, selectedCampId } = state;

  if (filters.query.trim() !== '') {
    params.set('q', filters.query.trim());
  }

  if (filters.season !== DEFAULT_FINDER_FILTERS.season) {
    params.set('season', filters.season);
  }

  if (filters.maxDistance != null) {
    params.set('maxDistance', String(filters.maxDistance));
  }

  if (filters.type !== DEFAULT_FINDER_FILTERS.type) {
    params.set('type', filters.type);
  }

  if (filters.age != null) {
    params.set('age', String(filters.age));
  }

  if (filters.savedOnly) {
    params.set('savedOnly', '1');
  }

  if (filters.sort !== DEFAULT_FINDER_FILTERS.sort) {
    params.set('sort', filters.sort);
  }

  if (selectedCampId != null && selectedCampId.trim() !== '') {
    params.set('selected', selectedCampId.trim());
  }

  return params.toString();
}

export function hasActiveFinderFilters(filters: FinderFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.season !== DEFAULT_FINDER_FILTERS.season ||
    filters.maxDistance != null ||
    filters.type !== DEFAULT_FINDER_FILTERS.type ||
    filters.age != null ||
    filters.savedOnly ||
    filters.sort !== DEFAULT_FINDER_FILTERS.sort
  );
}

