import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type {
  Camp,
  CampType,
  FinderFilters,
  FinderSeason,
  FinderSort,
} from '../types';
import { loadCamps } from '../../../lib/camps/loadCamps';
import { applyFilters } from '../../../lib/filters/applyFilters';
import {
  DEFAULT_FINDER_FILTERS,
  parseFinderShareState,
  stringifyFinderShareState,
} from '../../../lib/share/shareState';
import {
  loadSavedCampIds,
  saveSavedCampIds,
  toggleSavedCampId,
} from '../../../lib/saved/savedCamps';

type FinderLoadStatus = 'loading' | 'ready' | 'error';

export interface FinderState {
  status: FinderLoadStatus;
  error: string | null;
  camps: Camp[];
  filters: FinderFilters;
  selectedCampId: string | null;
  selectedCamp: Camp | null;
  selectedCampVisible: boolean;
  visibleCamps: Camp[];
  savedCampIds: Set<string>;
  savedCount: number;
  typeOptions: CampType[];
  setFilters: (updates: Partial<FinderFilters>) => void;
  setQuery: (query: string) => void;
  setSeason: (season: FinderSeason) => void;
  setMaxDistance: (maxDistance: number | null) => void;
  setType: (type: CampType | 'all') => void;
  setAge: (age: number | null) => void;
  setSort: (sort: FinderSort) => void;
  setSavedOnly: (savedOnly: boolean) => void;
  selectCamp: (campId: string | null) => void;
  toggleSavedCamp: (campId: string) => void;
  clearSavedCamps: () => void;
  resetFilters: () => void;
  retry: () => void;
}

function normalizePathSearch(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

export function useFinderState(): FinderState {
  const location = useLocation();
  const navigate = useNavigate();
  const initialShareState = parseFinderShareState(location.search);
  const [filters, setFiltersState] = useState<FinderFilters>(initialShareState.filters);
  const [selectedCampId, setSelectedCampId] = useState<string | null>(
    initialShareState.selectedCampId,
  );
  const [camps, setCamps] = useState<Camp[]>([]);
  const [status, setStatus] = useState<FinderLoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [savedCampIds, setSavedCampIdsState] = useState<Set<string>>(() =>
    loadSavedCampIds(),
  );
  const lastWrittenSearchRef = useRef(normalizePathSearch(location.search));
  const skipNextSearchWriteRef = useRef(false);

  useEffect(() => {
    const incomingSearch = normalizePathSearch(location.search);

    if (incomingSearch === lastWrittenSearchRef.current) {
      return;
    }

    skipNextSearchWriteRef.current = true;
    const nextShareState = parseFinderShareState(location.search);
    setFiltersState(nextShareState.filters);
    setSelectedCampId(nextShareState.selectedCampId);
  }, [location.search]);

  useEffect(() => {
    let active = true;

    setStatus('loading');
    setError(null);

    void loadCamps()
      .then((records) => {
        if (!active) {
          return;
        }

        setCamps(records);
        setStatus('ready');
      })
      .catch((thrown: unknown) => {
        if (!active) {
          return;
        }

        const message =
          thrown instanceof Error ? thrown.message : 'Failed to load camp data';
        setError(message);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    saveSavedCampIds(savedCampIds);
  }, [savedCampIds]);

  useEffect(() => {
    if (status !== 'ready' || camps.length === 0) {
      return;
    }

    if (selectedCampId != null && camps.some((camp) => camp.id === selectedCampId)) {
      return;
    }

    const nextSelectedCampId = camps[0]?.id ?? null;

    if (nextSelectedCampId !== selectedCampId) {
      setSelectedCampId(nextSelectedCampId);
    }
  }, [camps, selectedCampId, status]);

  useEffect(() => {
    if (skipNextSearchWriteRef.current) {
      skipNextSearchWriteRef.current = false;
      return;
    }

    const nextSearch = stringifyFinderShareState({
      filters,
      selectedCampId,
    });
    const currentSearch = normalizePathSearch(location.search);

    if (nextSearch === currentSearch) {
      return;
    }

    lastWrittenSearchRef.current = nextSearch;

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch === '' ? '' : `?${nextSearch}`,
      },
      { replace: true },
    );
  }, [filters, location.pathname, location.search, navigate, selectedCampId]);

  const visibleCamps = status === 'ready' ? applyFilters(camps, filters, savedCampIds) : [];
  const selectedCamp = selectedCampId
    ? camps.find((camp) => camp.id === selectedCampId) ?? null
    : null;
  const selectedCampVisible =
    selectedCampId != null ? visibleCamps.some((camp) => camp.id === selectedCampId) : false;
  const savedCount = savedCampIds.size;
  const typeOptions = Array.from(
    new Set(camps.flatMap((camp) => camp.typeTags)),
  ).sort((left, right) => left.localeCompare(right));

  function updateFilters(updates: Partial<FinderFilters>): void {
    setFiltersState((current) => ({
      ...current,
      ...updates,
    }));
  }

  function setQuery(query: string): void {
    updateFilters({ query });
  }

  function setSeason(season: FinderSeason): void {
    updateFilters({ season });
  }

  function setMaxDistance(maxDistance: number | null): void {
    updateFilters({ maxDistance });
  }

  function setType(type: CampType | 'all'): void {
    updateFilters({ type });
  }

  function setAge(age: number | null): void {
    updateFilters({ age });
  }

  function setSort(sort: FinderSort): void {
    updateFilters({ sort });
  }

  function setSavedOnly(savedOnly: boolean): void {
    updateFilters({ savedOnly });
  }

  function selectCamp(campId: string | null): void {
    setSelectedCampId(campId);
  }

  function toggleSavedCamp(campId: string): void {
    setSavedCampIdsState((current) => toggleSavedCampId(current, campId));
  }

  function clearSavedCamps(): void {
    setSavedCampIdsState(new Set());
  }

  function resetFilters(): void {
    setFiltersState(DEFAULT_FINDER_FILTERS);
  }

  function retry(): void {
    setReloadToken((current) => current + 1);
  }

  return {
    status,
    error,
    camps,
    filters,
    selectedCampId,
    selectedCamp,
    selectedCampVisible,
    visibleCamps,
    savedCampIds,
    savedCount,
    typeOptions,
    setFilters: updateFilters,
    setQuery,
    setSeason,
    setMaxDistance,
    setType,
    setAge,
    setSort,
    setSavedOnly,
    selectCamp,
    toggleSavedCamp,
    clearSavedCamps,
    resetFilters,
    retry,
  };
}
