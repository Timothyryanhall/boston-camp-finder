import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type {
  Camp,
  CampType,
  FinderAidFilter,
  FinderFilters,
  FinderFreshnessFilter,
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
  savedCamps: Camp[];
  typeOptions: CampType[];
  orgCounts: Record<string, number>;
  lastScrapedLabel: string | null;
  isSharedMode: boolean;
  setFilters: (updates: Partial<FinderFilters>) => void;
  setQuery: (query: string) => void;
  setSeason: (season: FinderSeason) => void;
  setMaxDistance: (maxDistance: number | null) => void;
  setType: (type: CampType | 'all') => void;
  setAge: (age: number | null) => void;
  setSort: (sort: FinderSort) => void;
  setMaxCost: (maxCost: number | null) => void;
  setAidFilter: (aid: FinderAidFilter) => void;
  setFreshnessFilter: (fresh: FinderFreshnessFilter) => void;
  setSelectedOrg: (org: string | null) => void;
  selectCamp: (campId: string | null) => void;
  toggleSavedCamp: (campId: string) => void;
  clearSavedCamps: () => void;
  resetFilters: () => void;
  retry: () => void;
}

function normalizePathSearch(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

function parseSharedIds(search: string): Set<string> | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const shared = params.get('shared');
  if (shared == null) return null;
  const ids = shared.split(',').map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 ? new Set(ids) : new Set();
}

export function useFinderState(): FinderState {
  const location = useLocation();
  const navigate = useNavigate();
  const initialShareState = parseFinderShareState(location.search);
  const sharedIdsOnLoad = parseSharedIds(location.search);
  const [isSharedMode, setIsSharedMode] = useState(sharedIdsOnLoad != null);
  const [filters, setFiltersState] = useState<FinderFilters>(() =>
    initialShareState.filters,
  );
  const [selectedCampId, setSelectedCampId] = useState<string | null>(
    initialShareState.selectedCampId,
  );
  const [camps, setCamps] = useState<Camp[]>([]);
  const [status, setStatus] = useState<FinderLoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [savedCampIds, setSavedCampIdsState] = useState<Set<string>>(
    () => sharedIdsOnLoad ?? loadSavedCampIds(),
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

  const campsForOrgCounts =
    status === 'ready'
      ? applyFilters(camps, { ...filters, selectedOrg: null })
      : [];

  const visibleCamps =
    filters.selectedOrg == null
      ? campsForOrgCounts
      : campsForOrgCounts.filter((camp) => camp.organization === filters.selectedOrg);

  const orgCounts: Record<string, number> = {};
  campsForOrgCounts.forEach((camp) => {
    const org = camp.organization || 'Unknown';
    orgCounts[org] = (orgCounts[org] || 0) + 1;
  });

  const selectedCamp = selectedCampId
    ? camps.find((camp) => camp.id === selectedCampId) ?? null
    : null;
  const selectedCampVisible =
    selectedCampId != null ? visibleCamps.some((camp) => camp.id === selectedCampId) : false;
  const savedCount = savedCampIds.size;
  const savedCamps = camps
    .filter((camp) => savedCampIds.has(camp.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const typeOptions = Array.from(
    new Set(camps.flatMap((camp) => camp.typeTags)),
  ).sort((left, right) => left.localeCompare(right));

  const lastScrapedLabel = (() => {
    const dates = camps.map((c) => c.lastScrapedAt).filter(Boolean).sort() as string[];
    if (!dates.length) return null;
    return new Date(dates[dates.length - 1]).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  })();

  function updateFilters(updates: Partial<FinderFilters>): void {
    setFiltersState((current) => ({ ...current, ...updates }));
    setIsSharedMode(false);
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
    savedCamps,
    typeOptions,
    orgCounts,
    lastScrapedLabel,
    isSharedMode,
    setFilters: updateFilters,
    setQuery: (query) => updateFilters({ query }),
    setSeason: (season) => updateFilters({ season }),
    setMaxDistance: (maxDistance) => updateFilters({ maxDistance }),
    setType: (type) => updateFilters({ type }),
    setAge: (age) => updateFilters({ age }),
    setSort: (sort) => updateFilters({ sort }),
    setMaxCost: (maxCost) => updateFilters({ maxCost }),
    setAidFilter: (aidFilter) => updateFilters({ aidFilter }),
    setFreshnessFilter: (freshnessFilter) => updateFilters({ freshnessFilter }),
    setSelectedOrg: (selectedOrg) => updateFilters({ selectedOrg }),
    selectCamp: (campId) => setSelectedCampId(campId),
    toggleSavedCamp: (campId) =>
      setSavedCampIdsState((current) => toggleSavedCampId(current, campId)),
    clearSavedCamps: () => {
      setSavedCampIdsState(new Set());
    },
    resetFilters: () => setFiltersState(DEFAULT_FINDER_FILTERS),
    retry: () => setReloadToken((current) => current + 1),
  };
}
