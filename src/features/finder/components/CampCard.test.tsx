import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Camp } from '../types';
import CampCard from './CampCard';

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

describe('CampCard', () => {
  it('shows age information in the mobile card summary', () => {
    render(
      <CampCard
        camp={baseCamp}
        isSaved={false}
        onToggleSaved={() => {}}
      />,
    );

    expect(screen.getByText('Ages 6-10 years')).toBeInTheDocument();
  });
});
