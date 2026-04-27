import { describe, expect, it } from 'vitest';

import type { FinderFilters, RawCampRecord } from '../../features/finder/types';
import { normalizeCamp } from '../camps/normalizeCamp';
import { applyFilters } from './applyFilters';

const rawCamps: RawCampRecord[] = [
  {
    camp_name: 'Zoo Crew',
    organization: 'Franklin Park Zoo',
    camp_type: 'Day - Nature/Animals',
    age_range: '5-12 years',
    weeks_available: 'June-August',
    neighborhood: 'Dorchester',
    address: '1 Franklin Park Rd',
    distance_from_roslindale_miles: 2.4,
    hours_of_day: '9am-3pm',
    cost_per_week: '$350',
    financial_aid_available: true,
    signup_opens: 'January 1',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Robotics Lab',
    organization: 'Museum of Science',
    camp_type: 'STEM',
    age_range: '10-14 years',
    weeks_available: 'July-October',
    neighborhood: 'Cambridge',
    address: '1 Science Park',
    distance_from_roslindale_miles: 6.2,
    hours_of_day: '10am-4pm',
    cost_per_week: '$500',
    financial_aid_available: false,
    signup_opens: 'February 1',
    data_year: 2026,
    data_is_stale: true,
  },
  {
    camp_name: 'Winter Artists',
    organization: 'Community Arts Center',
    camp_type: 'Specialty - Arts/Culture',
    age_range: '8-11 years',
    weeks_available: 'February break',
    neighborhood: 'Jamaica Plain',
    address: '12 Centre St',
    distance_from_roslindale_miles: null,
    hours_of_day: '9am-1pm',
    cost_per_week: '$275',
    signup_opens: '',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Culture Lab',
    organization: 'City Stage',
    camp_type: 'Specialty - Arts/Culture',
    age_range: '13 years and older',
    weeks_available: 'August',
    neighborhood: 'Mission Hill',
    address: '40 Tremont St',
    distance_from_roslindale_miles: 4.8,
    hours_of_day: '1pm-5pm',
    cost_per_week: '$150',
    financial_aid_available: false,
    signup_opens: 'March 15',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Leadership Lab',
    organization: 'City Youth Collective',
    camp_type: 'Leadership',
    age_range: 'Teens and Adults',
    weeks_available: 'July',
    neighborhood: 'Roxbury',
    address: '99 Warren St',
    distance_from_roslindale_miles: 4.1,
    hours_of_day: '11am-3pm',
    cost_per_week: 'Free (participants are paid in summer)',
    financial_aid_available: true,
    signup_opens: 'March 1',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Harbor Sail',
    organization: 'Community Boating',
    camp_type: 'Specialty - Sailing/STEM',
    age_range: '12-16 years',
    weeks_available: 'June-August',
    neighborhood: 'Back Bay',
    address: '21 David G Mugar Way',
    distance_from_roslindale_miles: 5.9,
    hours_of_day: '9am-4pm',
    cost_per_week: '$100-$500/week (sliding scale)',
    financial_aid_available: true,
    signup_opens: 'January 15',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Youth Circuit',
    organization: 'Tech Foundry',
    camp_type: 'STEM',
    age_range: 'Youth 10+',
    weeks_available: 'Summer',
    neighborhood: 'Allston',
    address: '17 Western Ave',
    distance_from_roslindale_miles: 7.4,
    hours_of_day: '10am-2pm',
    cost_per_week: '$225',
    financial_aid_available: true,
    signup_opens: 'April 1',
    data_year: 2026,
    data_is_stale: false,
  },
  {
    camp_name: 'Income Access Camp',
    organization: 'Neighborhood House',
    camp_type: 'Day - General',
    age_range: '6-10 years',
    weeks_available: 'Summer',
    neighborhood: 'Hyde Park',
    address: '8 River St',
    distance_from_roslindale_miles: 3.6,
    hours_of_day: '8am-2pm',
    cost_per_week: 'Sliding scale based on income',
    financial_aid_available: true,
    signup_opens: 'February 15',
    data_year: 2026,
    data_is_stale: false,
  },
];

const camps = rawCamps.map((camp) => normalizeCamp(camp));

function makeFilters(overrides: Partial<FinderFilters> = {}): FinderFilters {
  return {
    query: '',
    season: 'all',
    maxDistance: null,
    type: 'all',
    age: null,
    savedOnly: false,
    sort: 'distance',
    ...overrides,
  };
}

describe('applyFilters', () => {
  it('returns only matching camps for search, season, and max distance', () => {
    const result = applyFilters(
      camps,
      makeFilters({
        query: 'zoo',
        season: 'summer',
        maxDistance: 3,
      }),
      new Set(),
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('franklin-park-zoo-zoo-crew');
  });

  it('filters by type, age, and saved-only state', () => {
    const result = applyFilters(
      camps,
      makeFilters({
        type: 'STEM',
        age: 11,
        savedOnly: true,
      }),
      new Set(['museum-of-science-robotics-lab']),
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('museum-of-science-robotics-lab');
  });

  it('matches canonical types instead of raw source labels', () => {
    expect(
      applyFilters(
        camps,
        makeFilters({
          type: 'Sailing',
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).toEqual(['community-boating-harbor-sail']);

    expect(
      applyFilters(
        camps,
        makeFilters({
          type: 'STEM',
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).toEqual([
      'community-boating-harbor-sail',
      'museum-of-science-robotics-lab',
      'tech-foundry-youth-circuit',
    ]);
  });

  it('matches free-text queries against preserved raw subtype labels', () => {
    const result = applyFilters(
      camps,
      makeFilters({
        query: 'culture',
      }),
      new Set(),
    );

    expect(result.map((camp) => camp.id)).toContain('city-stage-culture-lab');
  });

  it('does not match clearly incompatible adult or teen labels for young children', () => {
    const result = applyFilters(
      camps,
      makeFilters({
        age: 6,
      }),
      new Set(),
    );

    expect(result.map((camp) => camp.id)).not.toContain(
      'city-youth-collective-leadership-lab',
    );
    expect(result.map((camp) => camp.id)).not.toContain(
      'community-boating-harbor-sail',
    );
    expect(result.map((camp) => camp.id)).not.toContain(
      'tech-foundry-youth-circuit',
    );
  });

  it('treats "years and older" labels as open-ended age ranges', () => {
    expect(
      applyFilters(
        camps,
        makeFilters({
          age: 14,
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).toContain('city-stage-culture-lab');

    expect(
      applyFilters(
        camps,
        makeFilters({
          age: 12,
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).not.toContain('city-stage-culture-lab');
  });

  it('parses numeric youth labels instead of treating them as ambiguous', () => {
    expect(
      applyFilters(
        camps,
        makeFilters({
          age: 12,
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).toContain('tech-foundry-youth-circuit');

    expect(
      applyFilters(
        camps,
        makeFilters({
          age: 9,
        }),
        new Set(),
      ).map((camp) => camp.id),
    ).not.toContain('tech-foundry-youth-circuit');
  });

  it('sorts by name, cost, currentness, and distance', () => {
    expect(
      applyFilters(camps, makeFilters({ sort: 'name' }), new Set()).map(
        (camp) => camp.id,
      ),
    ).toEqual([
      'city-stage-culture-lab',
      'community-boating-harbor-sail',
      'neighborhood-house-income-access-camp',
      'city-youth-collective-leadership-lab',
      'museum-of-science-robotics-lab',
      'community-arts-center-winter-artists',
      'tech-foundry-youth-circuit',
      'franklin-park-zoo-zoo-crew',
    ]);

    expect(
      applyFilters(camps, makeFilters({ sort: 'cost' }), new Set()).map(
        (camp) => camp.id,
      ),
    ).toEqual([
      'city-youth-collective-leadership-lab',
      'neighborhood-house-income-access-camp',
      'community-boating-harbor-sail',
      'city-stage-culture-lab',
      'tech-foundry-youth-circuit',
      'community-arts-center-winter-artists',
      'franklin-park-zoo-zoo-crew',
      'museum-of-science-robotics-lab',
    ]);

    expect(
      applyFilters(camps, makeFilters({ sort: 'current' }), new Set()).map(
        (camp) => camp.id,
      ),
    ).toEqual([
      'franklin-park-zoo-zoo-crew',
      'community-arts-center-winter-artists',
      'city-stage-culture-lab',
      'city-youth-collective-leadership-lab',
      'community-boating-harbor-sail',
      'tech-foundry-youth-circuit',
      'neighborhood-house-income-access-camp',
      'museum-of-science-robotics-lab',
    ]);

    expect(
      applyFilters(camps, makeFilters({ sort: 'distance' }), new Set()).map(
        (camp) => camp.id,
      ),
    ).toEqual([
      'franklin-park-zoo-zoo-crew',
      'neighborhood-house-income-access-camp',
      'city-youth-collective-leadership-lab',
      'city-stage-culture-lab',
      'community-boating-harbor-sail',
      'museum-of-science-robotics-lab',
      'tech-foundry-youth-circuit',
      'community-arts-center-winter-artists',
    ]);
  });
});
