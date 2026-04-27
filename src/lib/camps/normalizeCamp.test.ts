import { describe, expect, it } from 'vitest';

import { normalizeCamp } from './normalizeCamp';

describe('normalizeCamp', () => {
  it('maps raw JSON into a typed camp record', () => {
    const camp = normalizeCamp({
      camp_name: 'Zoo Crew',
      organization: 'Franklin Park Zoo',
      age_range: '5-12',
      weeks_available: 'June 24-August 2',
      neighborhood: 'Dorchester',
      cost_per_week: '$350',
      distance_from_roslindale_miles: 2.4,
      data_is_stale: false,
    });

    expect(camp.id).toBe('franklin-park-zoo-zoo-crew');
    expect(camp.name).toBe('Zoo Crew');
    expect(camp.organization).toBe('Franklin Park Zoo');
    expect(camp.type).toBe('General');
    expect(camp.rawType).toBe('');
    expect(camp.seasons).toEqual(['summer']);
    expect(camp.neighborhood).toBe('Dorchester');
    expect(camp.distanceMiles).toBe(2.4);
    expect(camp.costLabel).toBe('$350');
    expect(camp.isStale).toBe(false);
  });

  it('canonicalizes specialty and hybrid type labels for exact-match filtering', () => {
    const camp = normalizeCamp({
      camp_name: 'Harbor Explorers',
      organization: 'Boston Harbor Now',
      camp_type: 'Specialty - Sailing/STEM',
    });

    expect(camp.type).toBe('Sailing');
    expect(camp.typeTags).toEqual(['Sailing', 'STEM']);
    expect(camp.rawType).toBe('Specialty - Sailing/STEM');
  });

  it('normalizes nullish values and infers multiple seasons', () => {
    const camp = normalizeCamp({
      camp_name: 'Winter Makers',
      organization: 'Tech Hub',
      camp_type: 'STEM',
      weeks_available: 'February vacation and April break',
      website_url: 42,
      signup_url: undefined,
      distance_from_roslindale_miles: 'unknown',
      data_is_stale: 1,
    });

    expect(camp.ageRange).toBe('');
    expect(camp.seasons).toEqual(['spring', 'winter']);
    expect(camp.distanceMiles).toBeNull();
    expect(camp.websiteUrl).toBeNull();
    expect(camp.signupUrl).toBeNull();
    expect(camp.isStale).toBe(true);
  });
});
