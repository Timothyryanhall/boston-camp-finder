import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Camp } from '../types';
import CampDetailPanel from './CampDetailPanel';

const baseCamp: Camp = {
  id: 'camp-a',
  name: 'Camp A',
  organization: 'Org A',
  type: 'General',
  typeTags: ['General'],
  rawType: 'Day - General',
  ageRange: '6-10 years',
  seasons: ['summer'],
  neighborhood: 'Dorchester',
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

describe('CampDetailPanel', () => {
  it('distinguishes unavailable financial aid from missing data', () => {
    render(
      <CampDetailPanel
        camp={{ ...baseCamp, financialAidAvailable: false }}
        isSaved={false}
        isVisibleInResults
        onToggleSaved={() => {}}
      />,
    );

    expect(screen.getByText('Not available')).toBeInTheDocument();
  });
});
