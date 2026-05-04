import { useState } from 'react';
import type { FinderState } from '../hooks/useFinderState';
import type { FinderTab } from './FinderTabs';
import FilterBar from './FilterBar';
import CampList from './CampList';
import ResultsSummary from './ResultsSummary';
import SavedControls from './SavedControls';
import FinderTabs from './FinderTabs';
import { DEFAULT_FINDER_FILTERS } from '../../../lib/share/shareState';

export default function FinderLayout(finder: FinderState) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FinderTab>(
    finder.isSharedMode ? 'saved' : 'browse',
  );

  const f = finder.filters;
  const activeFilterCount = [
    f.query !== DEFAULT_FINDER_FILTERS.query,
    f.type !== DEFAULT_FINDER_FILTERS.type,
    f.age !== DEFAULT_FINDER_FILTERS.age,
    f.maxDistance !== DEFAULT_FINDER_FILTERS.maxDistance,
    f.maxCost !== DEFAULT_FINDER_FILTERS.maxCost,
    f.aidFilter !== DEFAULT_FINDER_FILTERS.aidFilter,
    f.season !== DEFAULT_FINDER_FILTERS.season,
    f.freshnessFilter !== DEFAULT_FINDER_FILTERS.freshnessFilter,
    f.selectedOrg !== DEFAULT_FINDER_FILTERS.selectedOrg,
  ].filter(Boolean).length;

  const tabBar = (
    <FinderTabs
      activeTab={activeTab}
      savedCount={finder.savedCount}
      onTabChange={setActiveTab}
    />
  );

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
        onResetFilters={finder.resetFilters}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1260px] px-3 py-4 pb-12 sm:px-6 sm:py-6">

      {/* ── Sticky tab bar (mobile) ── */}
      <div className="sticky top-[61px] z-30 -mx-3 mb-3 border-b border-stone-200 bg-[#d8e0e8]/95 px-3 py-2 backdrop-blur-sm lg:hidden">
        {tabBar}
      </div>

      <div className={activeTab === 'browse' ? 'grid gap-6 lg:grid-cols-[280px_1fr]' : ''}>

        {/* ── Desktop Sidebar (Browse tab only) ── */}
        {activeTab === 'browse' && (
          <aside className="hidden lg:block lg:sticky lg:top-[61px] lg:max-h-[calc(100dvh-85px)] lg:overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* ── Mobile slide-over (Browse tab only) ── */}
        {activeTab === 'browse' && mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
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
          ) : activeTab === 'saved' ? (
            <div className="space-y-3">
              {finder.isSharedMode && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                  <span className="font-bold">Viewing a shared list</span>
                  {' — '}{finder.savedCount} saved camp{finder.savedCount !== 1 ? 's' : ''}.
                  {' '}Add or remove camps, then copy your own link.
                </div>
              )}

              {/* Tab bar on desktop */}
              <div className="hidden lg:block">
                {tabBar}
              </div>

              {finder.savedCount === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-white px-6 py-12 text-center text-stone-400">
                  <p className="text-2xl">☆</p>
                  <p className="mt-2 text-sm font-medium">No saved camps yet.</p>
                  <p className="mt-1 text-xs">Browse camps and tap ☆ to save them here.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
                    <SavedControls
                      savedCount={finder.savedCount}
                      savedCampIds={finder.savedCampIds}
                      onClearSaved={finder.clearSavedCamps}
                    />
                  </div>
                  <CampList
                    camps={finder.savedCamps}
                    savedCampIds={finder.savedCampIds}
                    onToggleSavedCamp={finder.toggleSavedCamp}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tab bar on desktop */}
              <div className="hidden lg:block">
                {tabBar}
              </div>

              <ResultsSummary
                visibleCamps={finder.visibleCamps}
                totalCount={finder.camps.length}
              />

              {/* Mobile sticky filter bar */}
              <div className="sticky top-[110px] z-20 -mx-3 border-y border-stone-200 bg-[#d8e0e8]/95 px-3 py-2 backdrop-blur-sm sm:top-[89px] lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
                >
                  ⚙ Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {activeFilterCount}
                    </span>
                  )}
                  {finder.savedCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {finder.savedCount}
                    </span>
                  )}
                </button>
                <div className="mt-2 text-sm text-stone-500">
                  {`Showing ${finder.visibleCamps.length} of ${finder.camps.length} camps`}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-stone-200/70 pt-2">
                  <div className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Camp
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 text-center text-[10px] font-semibold tracking-tight text-stone-500">
                      Open
                    </div>
                    <div className="w-12 text-center text-[10px] font-semibold tracking-tight text-stone-500">
                      Fav
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden items-start justify-between gap-4 text-sm text-stone-500 lg:flex">
                <div className="flex items-center gap-3">
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
