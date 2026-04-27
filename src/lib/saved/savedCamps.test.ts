import { beforeEach, describe, expect, it } from 'vitest';

import { loadSavedCampIds, saveSavedCampIds } from './savedCamps';

function createStorageMock(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe('savedCamps', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createStorageMock();
  });

  it('persists saved camp ids in local storage', () => {
    expect(loadSavedCampIds(storage)).toEqual(new Set());

    saveSavedCampIds(new Set(['camp-a', 'camp-b']), storage);

    expect(loadSavedCampIds(storage)).toEqual(new Set(['camp-a', 'camp-b']));
    expect(storage.getItem('boston-camp-finder.saved-camps')).toBe(
      '["camp-a","camp-b"]',
    );
  });
});
