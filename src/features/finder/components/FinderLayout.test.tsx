import { fireEvent, render, screen } from '@testing-library/react';
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

const savedCamp: Camp = {
  ...baseCamp,
  id: 'camp-b',
  name: 'Camp B',
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
    savedCamps: [],
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
  it('renders Browse and Saved tabs', () => {
    render(<FinderLayout {...makeFinderState()} />);
    expect(screen.getAllByRole('tab', { name: 'Browse' })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('tab', { name: 'Saved' })[0]).toBeInTheDocument();
  });

  it('shows saved count in Saved tab button when camps are saved', () => {
    render(
      <FinderLayout
        {...makeFinderState({
          savedCount: 2,
          savedCampIds: new Set(['camp-a', 'camp-b']),
          savedCamps: [baseCamp, savedCamp],
        })}
      />,
    );
    expect(screen.getAllByRole('tab', { name: 'Saved (2)' })[0]).toBeInTheDocument();
  });

  it('switches to Saved tab on click and shows saved camps', () => {
    render(
      <FinderLayout
        {...makeFinderState({
          savedCount: 1,
          savedCampIds: new Set(['camp-b']),
          savedCamps: [savedCamp],
          visibleCamps: [baseCamp],
        })}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab', { name: 'Saved (1)' })[0]);

    expect(screen.getByText('Camp B')).toBeInTheDocument();
    expect(screen.queryByText('Camp A')).not.toBeInTheDocument();
  });

  it('initializes on Saved tab when isSharedMode is true', () => {
    render(
      <FinderLayout
        {...makeFinderState({
          isSharedMode: true,
          savedCount: 1,
          savedCampIds: new Set(['camp-b']),
          savedCamps: [savedCamp],
        })}
      />,
    );
    expect(screen.getByText('Camp B')).toBeInTheDocument();
    expect(screen.getByText(/Viewing a shared list/i)).toBeInTheDocument();
  });

  it('shows empty state on Saved tab when nothing is saved', () => {
    render(<FinderLayout {...makeFinderState()} />);

    fireEvent.click(screen.getAllByRole('tab', { name: 'Saved' })[0]);

    expect(screen.getByText(/No saved camps yet/i)).toBeInTheDocument();
  });
});
