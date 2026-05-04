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
  it('keeps the desktop sticky header for the full table columns', () => {
    render(
      <CampList
        camps={[camp]}
        savedCampIds={new Set()}
        onToggleSavedCamp={() => {}}
      />,
    );

    const agesHeader = screen.getByText('Ages');
    const stickyHeader = agesHeader.parentElement;

    expect(stickyHeader).toHaveClass('sm:sticky');
    expect(stickyHeader).toHaveClass('sm:top-[89px]');
  });
});
