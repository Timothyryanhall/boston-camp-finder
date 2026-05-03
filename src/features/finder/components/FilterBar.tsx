import type { CampType, FinderFilters, FinderSeason, FinderSort } from '../types';

interface FilterBarProps {
  filters: FinderFilters;
  typeOptions: CampType[];
  orgCounts: Record<string, number>;
  onFiltersChange: (updates: Partial<FinderFilters>) => void;
}

const inputCls =
  'w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-sans outline-none transition focus:border-teal-500 focus:bg-white';
const selectCls = inputCls;

const AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;

const DISTANCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Any' },
  { value: '2', label: '≤ 2 mi' },
  { value: '5', label: '≤ 5 mi' },
  { value: '7', label: '≤ 7 mi' },
  { value: '10', label: '≤ 10 mi' },
];

const COST_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Any' },
  { value: '250', label: '$250' },
  { value: '500', label: '$500' },
  { value: '750', label: '$750' },
  { value: '1000', label: '$1,000' },
];

const SEASON_OPTIONS: Array<{ value: FinderSeason; label: string }> = [
  { value: 'all', label: 'Any season' },
  { value: 'summer', label: '☀️ Summer' },
  { value: 'spring', label: '🌸 Spring' },
  { value: 'fall', label: '🍂 Fall' },
  { value: 'winter', label: '❄️ Winter' },
];

const SORT_OPTIONS: Array<{ value: FinderSort; label: string }> = [
  { value: 'distance', label: 'Closest' },
  { value: 'name', label: 'A–Z' },
  { value: 'cost', label: 'Lowest cost' },
  { value: 'current', label: 'Current first' },
];

const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.06em] text-stone-400 mb-1.5';

export default function FilterBar({
  filters,
  typeOptions,
  orgCounts,
  onFiltersChange,
}: FilterBarProps) {
  const orgs = Object.keys(orgCounts).sort();

  return (
    <div>
      {/* Header */}
      <div className="border-b border-stone-100 bg-teal-50/50 px-4 py-3.5">
        <p className="text-[13px] font-bold text-teal-700">Find a good fit</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100dvh - 180px)' }}>

        {/* Search */}
        <div>
          <label className={labelCls}>Search</label>
          <input
            className={inputCls}
            type="search"
            placeholder="Camp name, neighborhood…"
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
          />
        </div>

        {/* Type */}
        <div>
          <label className={labelCls}>Type</label>
          <select
            className={selectCls}
            value={filters.type}
            onChange={(e) => onFiltersChange({ type: e.target.value as CampType | 'all' })}
          >
            <option value="all">All types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Age + Distance */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Age</label>
            <select
              className={selectCls}
              value={filters.age == null ? '' : String(filters.age)}
              onChange={(e) =>
                onFiltersChange({ age: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              <option value="">Any</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === 16 ? '16+' : a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Distance</label>
            <select
              className={selectCls}
              value={filters.maxDistance == null ? '' : String(filters.maxDistance)}
              onChange={(e) =>
                onFiltersChange({
                  maxDistance: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            >
              {DISTANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Max cost + Aid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Max cost / wk</label>
            <select
              className={selectCls}
              value={filters.maxCost == null ? '' : String(filters.maxCost)}
              onChange={(e) =>
                onFiltersChange({ maxCost: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              {COST_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Aid</label>
            <select
              className={selectCls}
              value={filters.aidFilter}
              onChange={(e) =>
                onFiltersChange({ aidFilter: e.target.value as FinderFilters['aidFilter'] })
              }
            >
              <option value="all">Any</option>
              <option value="yes">Aid noted</option>
              <option value="known">Known</option>
            </select>
          </div>
        </div>

        {/* Season */}
        <div>
          <label className={labelCls}>Season</label>
          <select
            className={selectCls}
            value={filters.season}
            onChange={(e) => onFiltersChange({ season: e.target.value as FinderSeason })}
          >
            {SEASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Data year + Sort */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Data year</label>
            <select
              className={selectCls}
              value={filters.freshnessFilter}
              onChange={(e) =>
                onFiltersChange({
                  freshnessFilter: e.target.value as FinderFilters['freshnessFilter'],
                })
              }
            >
              <option value="all">Any</option>
              <option value="current">Current</option>
              <option value="stale">Prior</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Sort</label>
            <select
              className={selectCls}
              value={filters.sort}
              onChange={(e) => onFiltersChange({ sort: e.target.value as FinderSort })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Organization list */}
        {orgs.length > 0 && (
          <div>
            <p className={labelCls}>Organization</p>
            {filters.selectedOrg != null && (
              <button
                type="button"
                className="mb-1 w-full text-left text-xs font-semibold text-teal-600 hover:underline"
                onClick={() => onFiltersChange({ selectedOrg: null })}
              >
                ← All organizations
              </button>
            )}
            <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
              {orgs.map((org) => (
                <button
                  key={org}
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      selectedOrg: org === filters.selectedOrg ? null : org,
                    })
                  }
                  className={[
                    'flex items-center justify-between rounded px-2 py-1.5 text-left text-sm font-medium transition',
                    org === filters.selectedOrg
                      ? 'bg-teal-600 text-white'
                      : 'text-stone-700 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{org}</span>
                  <span className="ml-2 shrink-0 opacity-60">{orgCounts[org]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
