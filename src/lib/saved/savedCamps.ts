const STORAGE_KEY = 'boston-camp-finder.saved-camps';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function isStorageLike(value: unknown): value is StorageLike {
  return (
    typeof value === 'object' &&
    value != null &&
    typeof (value as StorageLike).getItem === 'function' &&
    typeof (value as StorageLike).setItem === 'function'
  );
}

function readStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return isStorageLike(window.localStorage) ? window.localStorage : null;
  } catch {
    return null;
  }
}

function parseSavedIds(raw: string | null): Set<string> {
  if (raw == null || raw.trim() === '') {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed.filter((value): value is string => typeof value === 'string' && value.trim() !== ''),
    );
  } catch {
    return new Set();
  }
}

export function loadSavedCampIds(storage: StorageLike | null = readStorage()): Set<string> {
  if (storage == null) {
    return new Set();
  }

  return parseSavedIds(storage.getItem(STORAGE_KEY));
}

export function saveSavedCampIds(
  savedCampIds: Set<string>,
  storage: StorageLike | null = readStorage(),
): void {
  if (storage == null) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(Array.from(savedCampIds)));
}

export function toggleSavedCampId(
  savedCampIds: Set<string>,
  campId: string,
): Set<string> {
  const next = new Set(savedCampIds);

  if (next.has(campId)) {
    next.delete(campId);
  } else {
    next.add(campId);
  }

  return next;
}

export function getSavedCampsStorageKey(): string {
  return STORAGE_KEY;
}
