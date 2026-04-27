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

  const camps = raw.map((record) => normalizeCamp((record ?? {}) as RawCampRecord));

  // Deduplicate generated IDs so saved-camp lookups are always 1-to-1
  const seen = new Map<string, number>();
  for (const camp of camps) {
    const count = seen.get(camp.id) ?? 0;
    seen.set(camp.id, count + 1);
    if (count > 0) {
      camp.id = `${camp.id}-${count + 1}`;
    }
  }

  return camps;
}
