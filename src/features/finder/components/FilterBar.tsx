import type { CampType, FinderFilters, FinderSeason, FinderSort } from '../types';

interface FilterBarProps {
  filters: FinderFilters;
  typeOptions: CampType[];
  onQueryChange: (query: string) => void;
  onSeasonChange: (season: FinderSeason) => void;
  onTypeChange: (type: CampType | 'all') => void;
  onMaxDistanceChange: (maxDistance: number | null) => void;
  onAgeChange: (age: number | null) => void;
  onSortChange: (sort: FinderSort) => void;
}

const SEASON_OPTIONS: Array<{ value: FinderSeason; label: string }> = [
  { value: 'all', label: 'All seasons' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
];

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '2', label: 'Within 2 miles' },
  { value: '5', label: 'Within 5 miles' },
  { value: '10', label: 'Within 10 miles' },
];

const SORT_OPTIONS: Array<{ value: FinderSort; label: string }> = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'name', label: 'Name' },
  { value: 'cost', label: 'Lowest cost' },
  { value: 'current', label: 'Current first' },
];

function parseNumberInput(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function FilterBar({
  filters,
  typeOptions,
  onQueryChange,
  onSeasonChange,
  onTypeChange,
  onMaxDistanceChange,
  onAgeChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <section className="rounded-[28px] border border-sand-200 bg-white/90 p-5 shadow-card">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
          Filters
        </p>
        <h2 className="text-xl font-black tracking-tight text-sand-900">
          Narrow the list
        </h2>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Search</span>
          <input
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition placeholder:text-sand-700/50 focus:border-teal-500 focus:bg-white"
            value={filters.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Camp, organization, neighborhood"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Season</span>
          <select
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            value={filters.season}
            onChange={(event) => onSeasonChange(event.target.value as FinderSeason)}
          >
            {SEASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Camp type</span>
          <select
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            value={filters.type}
            onChange={(event) => onTypeChange(event.target.value as CampType | 'all')}
          >
            <option value="all">All types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Distance</span>
          <select
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            value={filters.maxDistance == null ? '' : String(filters.maxDistance)}
            onChange={(event) => onMaxDistanceChange(parseNumberInput(event.target.value))}
          >
            {DISTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Age</span>
          <input
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition placeholder:text-sand-700/50 focus:border-teal-500 focus:bg-white"
            type="number"
            min="0"
            inputMode="numeric"
            value={filters.age == null ? '' : String(filters.age)}
            onChange={(event) => onAgeChange(parseNumberInput(event.target.value))}
            placeholder="Any age"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-sand-700">Sort</span>
          <select
            className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            value={filters.sort}
            onChange={(event) => onSortChange(event.target.value as FinderSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

