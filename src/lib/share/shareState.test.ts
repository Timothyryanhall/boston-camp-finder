import { describe, expect, it } from 'vitest';

import type { FinderFilters } from '../../features/finder/types';
import {
  DEFAULT_FINDER_FILTERS,
  hasActiveFinderFilters,
  parseFinderShareState,
  stringifyFinderShareState,
} from './shareState';

function makeFilters(overrides: Partial<FinderFilters> = {}): FinderFilters {
  return { ...DEFAULT_FINDER_FILTERS, ...overrides };
}

describe('parseFinderShareState', () => {
  it('returns defaults when search is empty', () => {
    const state = parseFinderShareState('');
    expect(state.filters).toEqual(DEFAULT_FINDER_FILTERS);
    expect(state.selectedCampId).toBeNull();
  });

  it('parses all supported filter params', () => {
    const state = parseFinderShareState(
      '?q=zoo&season=summer&type=STEM&maxDistance=5&age=8&savedOnly=1&sort=name&selected=camp-a',
    );

    expect(state.filters.query).toBe('zoo');
    expect(state.filters.season).toBe('summer');
    expect(state.filters.type).toBe('STEM');
    expect(state.filters.maxDistance).toBe(5);
    expect(state.filters.age).toBe(8);
    expect(state.filters.savedOnly).toBe(true);
    expect(state.filters.sort).toBe('name');
    expect(state.selectedCampId).toBe('camp-a');
  });

  it('falls back to defaults for invalid season and sort values', () => {
    const state = parseFinderShareState('?season=rainy&sort=vibes');
    expect(state.filters.season).toBe(DEFAULT_FINDER_FILTERS.season);
    expect(state.filters.sort).toBe(DEFAULT_FINDER_FILTERS.sort);
  });

  it('treats savedOnly=true as true and any other value as false', () => {
    expect(parseFinderShareState('?savedOnly=true').filters.savedOnly).toBe(true);
    expect(parseFinderShareState('?savedOnly=1').filters.savedOnly).toBe(true);
    expect(parseFinderShareState('?savedOnly=0').filters.savedOnly).toBe(false);
    expect(parseFinderShareState('?savedOnly=yes').filters.savedOnly).toBe(false);
  });

  it('accepts search string without leading question mark', () => {
    const state = parseFinderShareState('q=sailing&season=summer');
    expect(state.filters.query).toBe('sailing');
    expect(state.filters.season).toBe('summer');
  });
});

describe('stringifyFinderShareState', () => {
  it('returns empty string for default state', () => {
    expect(
      stringifyFinderShareState({ filters: DEFAULT_FINDER_FILTERS, selectedCampId: null }),
    ).toBe('');
  });

  it('serializes only non-default values', () => {
    const result = stringifyFinderShareState({
      filters: makeFilters({ query: 'zoo', season: 'summer' }),
      selectedCampId: null,
    });
    const params = new URLSearchParams(result);
    expect(params.get('q')).toBe('zoo');
    expect(params.get('season')).toBe('summer');
    expect(params.get('type')).toBeNull();
    expect(params.get('sort')).toBeNull();
  });

  it('does not include selectedCampId in the URL', () => {
    const result = stringifyFinderShareState({
      filters: DEFAULT_FINDER_FILTERS,
      selectedCampId: 'camp-a',
    });
    const params = new URLSearchParams(result);
    expect(params.get('selected')).toBeNull();
  });

  it('round-trips filters through parse without data loss', () => {
    const original = {
      filters: makeFilters({
        query: 'zoo',
        season: 'summer',
        type: 'Nature',
        maxDistance: 5,
        age: 8,
        savedOnly: true,
        sort: 'cost',
      }),
      selectedCampId: 'camp-a',
    };

    const serialized = stringifyFinderShareState(original);
    const restored = parseFinderShareState(serialized);

    expect(restored.filters).toEqual(original.filters);
    // selectedCampId is intentionally not serialized to the URL
    expect(restored.selectedCampId).toBeNull();
  });
});

describe('hasActiveFinderFilters', () => {
  it('returns false for default filters', () => {
    expect(hasActiveFinderFilters(DEFAULT_FINDER_FILTERS)).toBe(false);
  });

  it('returns true when any filter differs from default', () => {
    expect(hasActiveFinderFilters(makeFilters({ query: 'zoo' }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ season: 'summer' }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ type: 'STEM' }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ maxDistance: 5 }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ age: 8 }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ savedOnly: true }))).toBe(true);
    expect(hasActiveFinderFilters(makeFilters({ sort: 'name' }))).toBe(true);
  });
});
