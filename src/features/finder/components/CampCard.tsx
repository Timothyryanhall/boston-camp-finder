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
  const url = camp.signupUrl ?? camp.websiteUrl;

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
          {url ? (
            <a
              href={url}
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
        <div className="border-t border-stone-100 bg-stone-50 px-4 pb-4 pt-3 pl-12">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-stone-600">
            {camp.weeksLabel && (
              <span><span className="font-semibold text-stone-700">When:</span> {camp.weeksLabel}</span>
            )}
            {camp.hoursLabel && (
              <span><span className="font-semibold text-stone-700">Hours:</span> {camp.hoursLabel}</span>
            )}
            {camp.financialAidAvailable === true && (
              <span className="font-semibold text-teal-700">Financial aid available</span>
            )}
            {camp.neighborhood && (
              <span><span className="font-semibold text-stone-700">Location:</span> {camp.neighborhood}</span>
            )}
            {camp.signupOpensLabel && (
              <span><span className="font-semibold text-stone-700">Signup opens:</span> {camp.signupOpensLabel}</span>
            )}
            {camp.isStale && (
              <span className="font-semibold text-amber-600">Data may be from a prior year</span>
            )}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-teal-600 hover:underline"
            >
              {url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
