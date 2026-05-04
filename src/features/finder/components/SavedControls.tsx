import { useState } from 'react';
import type { Camp } from '../types';

interface SavedControlsProps {
  savedCount: number;
  savedCampIds: Set<string>;
  savedCamps: Camp[];
  onClearSaved: () => void;
}

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return '""';
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function SavedControls({
  savedCount,
  savedCampIds,
  savedCamps,
  onClearSaved,
}: SavedControlsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  function downloadCsv() {
    const headers = [
      'Name', 'Organization', 'Type', 'Ages', 'Neighborhood', 'Address',
      'Distance (mi)', 'Hours', 'Schedule', 'Cost/Week', 'Financial Aid',
      'Signup Opens', 'Website', 'Signup URL',
    ];
    const rows = savedCamps.map((c) => [
      c.name,
      c.organization,
      c.type,
      c.ageRange,
      c.neighborhood,
      c.address,
      c.distanceMiles ?? '',
      c.hoursLabel,
      c.weeksLabel,
      c.costLabel,
      c.financialAidAvailable === true ? 'Yes' : c.financialAidAvailable === false ? 'No' : '',
      c.signupOpensLabel,
      c.websiteUrl ?? '',
      c.signupUrl ?? '',
    ].map(csvCell).join(','));

    const csv = [headers.map(csvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved-camps.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

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
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-amber-600">
        ★ {savedCount} saved {savedCount === 1 ? 'camp' : 'camps'}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={copyShareLink}
          className={[
            'rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
            copyStatus === 'copied'
              ? 'border-teal-300 bg-teal-50 text-teal-700'
              : 'border-stone-200 text-stone-700 hover:bg-stone-50',
          ].join(' ')}
        >
          {copyStatus === 'copied' ? '✓ Copied!' : '🔗 Copy link'}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          ↓ CSV
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          🖨 Print
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          onClick={onClearSaved}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
