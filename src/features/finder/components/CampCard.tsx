import { useState } from 'react';
import type { Camp } from '../types';

const TYPE_ICONS: Record<string, string> = {
  Nature: '🌿',
  STEM: '🔬',
  Arts: '🎨',
  Sports: '⚽',
  Academic: '📚',
  Music: '🎵',
  Theater: '🎭',
  General: '🏕️',
  Technology: '💻',
  Swimming: '🏊',
  Dance: '💃',
  Cooking: '🍳',
  Circus: '🎪',
  Leadership: '🌟',
  Sailing: '⛵',
};

interface CampCardProps {
  camp: Camp;
  isSaved: boolean;
  onToggleSaved: (campId: string) => void;
}

export default function CampCard({ camp, isSaved, onToggleSaved }: CampCardProps) {
  const [open, setOpen] = useState(false);

  const icon = TYPE_ICONS[camp.type] ?? '🏕️';
  const signupUrl = camp.signupUrl ?? null;
  const websiteUrl = camp.websiteUrl ?? null;
  const primaryUrl = signupUrl ?? websiteUrl;

  const detailRows: [string, string | null | undefined][] = [
    ['Location', camp.neighborhood || null],
    ['Hours', camp.hoursLabel || null],
    ['When', camp.weeksLabel || null],
    ['Financial aid', camp.financialAidAvailable === true
      ? 'Aid available'
      : camp.financialAidAvailable === false
      ? 'No aid listed'
      : null],
  ];

  return (
    <div className="border-b border-stone-100 last:border-b-0">
      {/* Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}
        className={[
          'grid cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors',
          'grid-cols-[1fr_90px_100px_80px_32px_48px]',
          open ? 'bg-stone-50' : 'hover:bg-stone-50/60',
        ].join(' ')}
      >
        {/* Camp name + org */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-base" title={camp.type}>{icon}</span>
          <div className="min-w-0">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-bold text-stone-900">
              {camp.name}
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-stone-400">
              {camp.organization}
            </div>
          </div>
        </div>

        {/* Ages */}
        <div className="text-right text-xs text-stone-400">
          {camp.ageRange || '—'}
        </div>

        {/* Cost */}
        <div className="text-right text-xs font-medium text-stone-700">
          {camp.costLabel || '—'}
        </div>

        {/* Distance */}
        <div className="text-right text-xs text-stone-400">
          {camp.distanceMiles != null ? `${camp.distanceMiles.toFixed(1)} mi` : '—'}
        </div>

        {/* Link */}
        <div className="flex justify-center">
          {primaryUrl ? (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-teal-600 hover:text-teal-800"
              title="Visit website"
            >
              ↗
            </a>
          ) : null}
        </div>

        {/* Save */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved(camp.id);
            }}
            title={isSaved ? 'Remove from saved' : 'Save camp'}
            className={[
              'text-lg leading-none transition-colors',
              isSaved ? 'text-amber-400' : 'text-stone-200 hover:text-amber-300',
            ].join(' ')}
          >
            ★
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-stone-100 bg-stone-50 px-5 pb-5 pt-4">
          {/* Labeled detail grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {detailRows.map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {label}
                </div>
                <div className={['mt-0.5 text-[13px] font-medium', value ? 'text-stone-700' : 'text-stone-300'].join(' ')}>
                  {value ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Badges row */}
          {(camp.signupOpensLabel || camp.isStale) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {camp.signupOpensLabel && (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                  Opens {camp.signupOpensLabel}
                </span>
              )}
              {camp.isStale && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  Data may be from a prior year
                </span>
              )}
            </div>
          )}

          {/* CTA row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {signupUrl ? (
              <a
                href={signupUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-85"
              >
                Register →
              </a>
            ) : primaryUrl ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-85"
              >
                Visit camp →
              </a>
            ) : (
              <span className="text-[13px] text-stone-400">No registration link</span>
            )}
            {websiteUrl && websiteUrl !== signupUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] font-semibold text-stone-400 underline decoration-stone-200 hover:text-stone-600"
              >
                Camp website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
