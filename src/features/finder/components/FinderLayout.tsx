import { useState } from 'react';
import type { FinderState } from '../hooks/useFinderState';
import FilterBar from './FilterBar';
import CampList from './CampList';
import ResultsSummary from './ResultsSummary';
import SavedControls from './SavedControls';

export default function FinderLayout(finder: FinderState) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const sidebar = (
    <div
      className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.05)' }}
    >
      <FilterBar
        filters={finder.filters}
        typeOptions={finder.typeOptions}
        orgCounts={finder.orgCounts}
        onFiltersChange={finder.setFilters}
      />

      {(finder.savedCount > 0 || finder.filters.savedOnly) && (
        <SavedControls
          savedCount={finder.savedCount}
          savedOnly={finder.filters.savedOnly}
          onToggleSavedOnly={finder.setSavedOnly}
          onClearSaved={finder.clearSavedCamps}
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1260px] px-6 py-6 pb-12">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block lg:sticky lg:top-[61px] lg:max-h-[calc(100dvh-85px)] lg:overflow-y-auto">
          {sidebar}
        </aside>

        {/* ── Mobile slide-over ── */}
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            {/* Panel */}
            <div className="fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-white shadow-xl lg:hidden">
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                <span className="text-sm font-bold text-stone-700">Filters</span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-sm font-semibold text-teal-600 hover:text-teal-800"
                >
                  Show results →
                </button>
              </div>
              {sidebar}
            </div>
          </>
        )}

        {/* ── Main ── */}
        <main>
          {finder.status === 'loading' ? (
            <div
              className="overflow-hidden rounded-xl border border-stone-200 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06)' }}
            >
              <div className="grid grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border-r border-stone-100 p-4 last:border-r-0"
                  >
                    <div className="h-6 w-10 animate-pulse rounded bg-stone-100" />
                    <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-stone-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : finder.status === 'error' ? (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-6"
              style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-rose-700">
                Load error
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-rose-900">
                Could not load camps
              </h2>
              <p className="mt-1.5 text-sm text-rose-800">
                {finder.error ?? 'The camp data could not be fetched.'}
              </p>
              <button
                type="button"
                className="mt-4 rounded-full bg-rose-900 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
                onClick={finder.retry}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <ResultsSummary
                visibleCamps={finder.visibleCamps}
                totalCount={finder.camps.length}
              />

              <div className="flex items-start justify-between gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-3">
                  {/* Mobile: Filters toggle */}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 lg:hidden"
                  >
                    ⚙ Filters
                    {finder.savedCount > 0 && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                        {finder.savedCount}
                      </span>
                    )}
                  </button>
                  <span>
                    {`Showing ${finder.visibleCamps.length} of ${finder.camps.length} camps`}
                  </span>
                </div>
                <span className="max-w-sm text-right text-xs italic">
                  This is a starting point — always verify dates, cost, and
                  availability directly with each camp before registering.
                </span>
              </div>

              <CampList
                camps={finder.visibleCamps}
                savedCampIds={finder.savedCampIds}
                onToggleSavedCamp={finder.toggleSavedCamp}
              />

              <footer className="mt-6 border-t border-stone-200 pt-4 text-xs leading-relaxed text-stone-400">
                Data scraped periodically via GitHub Actions using Claude.
                Information may be from a prior year — always check directly
                with each camp.
                {finder.lastScrapedLabel
                  ? ` Last updated ${finder.lastScrapedLabel}.`
                  : null}
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
