import type { Camp, FinderFilters } from '../types';
import { hasActiveFinderFilters } from '../../../lib/share/shareState';

interface ResultsSummaryProps {
  totalCount: number;
  visibleCount: number;
  filters: FinderFilters;
  selectedCamp: Camp | null;
  onResetFilters: () => void;
}

function buildFilterLabels(filters: FinderFilters): string[] {
  const labels: string[] = [];

  if (filters.query.trim() !== '') {
    labels.push(`Search: ${filters.query.trim()}`);
  }

  if (filters.season !== 'all') {
    labels.push(`Season: ${filters.season}`);
  }

  if (filters.type !== 'all') {
    labels.push(`Type: ${filters.type}`);
  }

  if (filters.maxDistance != null) {
    labels.push(`Within ${filters.maxDistance} miles`);
  }

  if (filters.age != null) {
    labels.push(`Age ${filters.age}+`);
  }

  if (filters.savedOnly) {
    labels.push('Saved only');
  }

  if (filters.sort !== 'distance') {
    labels.push(`Sort: ${filters.sort}`);
  }

  return labels;
}

export default function ResultsSummary({
  totalCount,
  visibleCount,
  filters,
  selectedCamp,
  onResetFilters,
}: ResultsSummaryProps) {
  const labels = buildFilterLabels(filters);

  return (
    <section className="rounded-[28px] border border-sand-200 bg-white/90 p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
            Results
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-sand-900">
            {visibleCount} of {totalCount} camps
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sand-700">
            {selectedCamp
              ? `Selected: ${selectedCamp.name} in ${selectedCamp.neighborhood || 'Boston'}`
              : 'Pick a camp to see more detail, or refine the filters to narrow the list.'}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onResetFilters}
          disabled={!hasActiveFinderFilters(filters)}
        >
          Reset filters
        </button>
      </div>

      {labels.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-sand-700"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

