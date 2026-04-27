import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Camp } from '../types';
import CampList from './CampList';

const camp: Camp = {
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
  websiteUrl: 'https://example.com',
  signupUrl: null,
};

describe('CampList', () => {
  it('shows readable mobile header labels for the visible columns', () => {
    render(
      <CampList
        camps={[camp]}
        savedCampIds={new Set()}
        onToggleSavedCamp={() => {}}
      />,
    );

    expect(screen.getAllByText('Camp').length).toBeGreaterThan(0);
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Fav')).toBeInTheDocument();
  });
});
