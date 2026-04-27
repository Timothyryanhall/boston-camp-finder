interface SavedControlsProps {
  savedCount: number;
  savedOnly: boolean;
  onToggleSavedOnly: (savedOnly: boolean) => void;
  onClearSaved: () => void;
}

export default function SavedControls({
  savedCount,
  savedOnly,
  onToggleSavedOnly,
  onClearSaved,
}: SavedControlsProps) {
  return (
    <section className="rounded-[28px] border border-sand-200 bg-white/90 p-5 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
        Saved
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-sand-900">
          {savedCount} camp{savedCount === 1 ? '' : 's'} saved
        </h2>
        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-sand-700">
          Local only
        </span>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-sand-900">
            Show saved only
          </span>
          <span className="block text-xs text-sand-700">
            Filter the list to saved camps.
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-sand-300 text-teal-700 focus:ring-teal-600"
          checked={savedOnly}
          onChange={(event) => onToggleSavedOnly(event.target.checked)}
        />
      </label>

      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center rounded-full border border-sand-200 px-4 py-2 text-sm font-semibold text-sand-700 transition hover:border-sand-300 hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onClearSaved}
        disabled={savedCount === 0}
      >
        Clear saved camps
      </button>
    </section>
  );
}

