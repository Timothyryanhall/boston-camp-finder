import { useState } from 'react';

interface SavedControlsProps {
  savedCount: number;
  savedOnly: boolean;
  savedCampIds: Set<string>;
  onToggleSavedOnly: (savedOnly: boolean) => void;
  onClearSaved: () => void;
}

export default function SavedControls({
  savedCount,
  savedOnly,
  savedCampIds,
  onToggleSavedOnly,
  onClearSaved,
}: SavedControlsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  function copyShareLink() {
    const ids = Array.from(savedCampIds).join(',');
    const url = `${window.location.origin}${window.location.pathname}?shared=${encodeURIComponent(ids)}`;
    const markCopied = () => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(markCopied).catch(() => {
        fallbackCopy(url, markCopied);
      });
    } else {
      fallbackCopy(url, markCopied);
    }
  }

  function fallbackCopy(text: string, onDone: () => void) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      onDone();
    } catch {
      // silent fallback failure
    }
    document.body.removeChild(el);
  }

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

      {savedCount > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={copyShareLink}
            className={[
              'rounded-lg border px-2 py-1.5 text-xs font-semibold transition',
              copyStatus === 'copied'
                ? 'border-teal-300 bg-teal-50 text-teal-700'
                : 'border-stone-200 text-stone-700 hover:bg-stone-50',
            ].join(' ')}
          >
            {copyStatus === 'copied' ? '✓ Copied!' : '🔗 Copy link'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            🖨 Print
          </button>
        </div>
      )}
    </div>
  );
}
