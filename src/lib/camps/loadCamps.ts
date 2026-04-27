import type { Camp, RawCampRecord } from '../../features/finder/types';

import { normalizeCamp } from './normalizeCamp';

export async function loadCamps(): Promise<Camp[]> {
  const response = await fetch('/data.json');

  if (!response.ok) {
    throw new Error(`Failed to load camps: ${response.status}`);
  }

  const raw = (await response.json()) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error('Failed to load camps: invalid payload');
  }

  return raw.map((record) => normalizeCamp((record ?? {}) as RawCampRecord));
}
