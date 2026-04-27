import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_FINDER_FILTERS } from '../../../lib/share/shareState';
import type { Camp } from '../types';
import type { FinderState } from '../hooks/useFinderState';
import FinderLayout from './FinderLayout';

const baseCamp: Camp = {
  id: 'camp-a',
  name: 'Camp A',
  organization: 'Org A',
  type: 'General',
  typeTags: ['General'],
  rawType: 'Day - General',
  ageRange: '6-10 years',
  seasons: ['summer'],
  neighborhood: 'Roslindale',
  address: '1 Main St',
  distanceMiles: 2.4,
  hoursLabel: '9am-3pm',
  weeksLabel: 'June-August',
  costLabel: '$350',
  financialAidAvailable: true,
  signupOpensLabel: 'March 1',
  dataYear: 2026,
  isStale: false,
  lastScrapedAt: null,
  websiteUrl: null,
  signupUrl: null,
};

function makeFinderState(overrides: Partial<FinderState> = {}): FinderState {
  return {
    status: 'ready',
    error: null,
    camps: [baseCamp],
    filters: DEFAULT_FINDER_FILTERS,
    selectedCampId: null,
    selectedCamp: null,
    selectedCampVisible: false,
    visibleCamps: [baseCamp],
    savedCampIds: new Set(),
    savedCount: 0,
    typeOptions: ['General'],
    orgCounts: { 'Org A': 1 },
    lastScrapedLabel: 'Apr 27, 2026',
    isSharedMode: false,
    setFilters: vi.fn(),
    setQuery: vi.fn(),
    setSeason: vi.fn(),
    setMaxDistance: vi.fn(),
    setType: vi.fn(),
    setAge: vi.fn(),
    setSort: vi.fn(),
    setSavedOnly: vi.fn(),
    setMaxCost: vi.fn(),
    setAidFilter: vi.fn(),
    setFreshnessFilter: vi.fn(),
    setSelectedOrg: vi.fn(),
    selectCamp: vi.fn(),
    toggleSavedCamp: vi.fn(),
    clearSavedCamps: vi.fn(),
    resetFilters: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('FinderLayout', () => {
  it('keeps the mobile filters trigger in a sticky bar below the header', () => {
    render(<FinderLayout {...makeFinderState()} />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    const stickyBar = filtersButton.closest('div');

    expect(stickyBar).toHaveClass('sticky');
    expect(stickyBar).toHaveClass('top-[61px]');
    expect(stickyBar).toHaveClass('lg:hidden');
  });
});
