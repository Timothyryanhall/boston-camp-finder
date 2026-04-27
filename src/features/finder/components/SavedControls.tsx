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
    <div className="border-t border-stone-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
          ★ Saved ({savedCount})
        </span>
        {savedCount > 0 && (
          <button
            type="button"
            className="text-[11px] text-stone-400 hover:text-stone-600"
            onClick={onClearSaved}
          >
            Clear all
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggleSavedOnly(!savedOnly)}
        className={[
          'mt-2 w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition',
          savedOnly
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-stone-200 text-stone-700 hover:bg-stone-50',
        ].join(' ')}
      >
        {savedOnly ? '★ Showing saved only' : savedCount > 0 ? '☆ Show saved only' : 'Show all camps'}
      </button>
    </div>
  );
}
