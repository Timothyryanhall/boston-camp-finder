import type { FinderState } from '../hooks/useFinderState';
import FilterBar from './FilterBar';
import ResultsSummary from './ResultsSummary';
import CampList from './CampList';
import CampDetailPanel from './CampDetailPanel';
import MapPanel from './MapPanel';
import SavedControls from './SavedControls';

export default function FinderLayout(finder: FinderState) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-card backdrop-blur">
      <div className="border-b border-sand-200/80 px-6 py-6 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
          Public finder
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-sand-900 sm:text-5xl">
          Boston Camp Finder
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-sand-700">
          Browse the current camp list, filter by season or age, and keep a
          shortlist in your browser.
        </p>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)] lg:px-8">
        <div className="space-y-6">
          {finder.status === 'loading' ? (
            <section className="rounded-[28px] border border-sand-200 bg-white/90 p-6 shadow-card">
              <div className="h-4 w-32 animate-pulse rounded-full bg-sand-100" />
              <div className="mt-4 h-8 w-64 animate-pulse rounded-full bg-sand-100" />
              <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-sand-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-sand-100" />
            </section>
          ) : finder.status === 'error' ? (
            <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-800">
                Load error
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-rose-950">
                Could not load camps
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-900">
                {finder.error ?? 'The camp dataset could not be fetched.'}
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
                onClick={finder.retry}
              >
                Try again
              </button>
            </section>
          ) : (
            <>
              <FilterBar
                filters={finder.filters}
                typeOptions={finder.typeOptions}
                onQueryChange={finder.setQuery}
                onSeasonChange={finder.setSeason}
                onTypeChange={finder.setType}
                onMaxDistanceChange={finder.setMaxDistance}
                onAgeChange={finder.setAge}
                onSortChange={finder.setSort}
              />

              <ResultsSummary
                totalCount={finder.camps.length}
                visibleCount={finder.visibleCamps.length}
                filters={finder.filters}
                selectedCamp={finder.selectedCamp}
                onResetFilters={finder.resetFilters}
              />

              <CampList
                camps={finder.visibleCamps}
                selectedCampId={finder.selectedCampId}
                savedCampIds={finder.savedCampIds}
                onSelectCamp={finder.selectCamp}
                onToggleSavedCamp={finder.toggleSavedCamp}
                emptyTitle={
                  finder.filters.savedOnly
                    ? 'No saved camps match your current filters'
                    : 'No camps match your filters'
                }
                emptyDescription={
                  finder.filters.savedOnly
                    ? 'Turn off saved-only mode or clear some filters to see more camps.'
                    : 'Relax one filter at a time to expand the list.'
                }
              />

              <MapPanel
                camps={finder.visibleCamps}
                selectedCamp={finder.selectedCamp}
              />
            </>
          )}
        </div>

        <aside className="space-y-6">
          <SavedControls
            savedCount={finder.savedCount}
            savedOnly={finder.filters.savedOnly}
            onToggleSavedOnly={finder.setSavedOnly}
            onClearSaved={finder.clearSavedCamps}
          />

          <CampDetailPanel
            camp={finder.selectedCamp}
            isSaved={finder.selectedCamp ? finder.savedCampIds.has(finder.selectedCamp.id) : false}
            isVisibleInResults={finder.selectedCampVisible}
            onToggleSaved={finder.toggleSavedCamp}
          />
        </aside>
      </div>
    </section>
  );
}

