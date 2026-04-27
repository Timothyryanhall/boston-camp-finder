import type { Camp } from '../types';
import CampCard from './CampCard';

interface CampListProps {
  camps: Camp[];
  savedCampIds: Set<string>;
  onToggleSavedCamp: (campId: string) => void;
}

export default function CampList({ camps, savedCampIds, onToggleSavedCamp }: CampListProps) {
  if (camps.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-stone-200 bg-white p-12 text-center"
        style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06)' }}
      >
        <div className="text-3xl">🔍</div>
        <div className="mt-2 font-semibold text-stone-700">No camps match your filters</div>
        <div className="mt-1 text-sm text-stone-400">
          Try widening your search or removing a filter.
        </div>
      </div>
    );
  }

  return (
    <div
      className="[overflow:clip] rounded-xl border border-stone-200 bg-white"
      style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.05)' }}
    >
      {/* Sticky column header */}
      <div className="sticky top-[61px] z-10 grid grid-cols-[1fr_32px_48px] gap-2 border-b-[1.5px] border-stone-200 bg-sand-100 px-4 py-2 sm:grid-cols-[1fr_90px_100px_80px_32px_48px] sm:gap-3">
        {['Camp', 'Ages', 'Cost / wk', 'Distance', '', 'Save'].map((h, i) => (
          <div
            key={i}
            className={[
              'text-[10px] font-bold uppercase tracking-widest text-stone-400',
              i === 0 ? 'text-left' : i === 5 ? 'text-center' : 'text-right',
              i >= 1 && i <= 4 ? 'hidden sm:block' : '',
            ].join(' ')}
          >
            {h}
          </div>
        ))}
      </div>

      {camps.map((camp) => (
        <CampCard
          key={camp.id}
          camp={camp}
          isSaved={savedCampIds.has(camp.id)}
          onToggleSaved={onToggleSavedCamp}
        />
      ))}
    </div>
  );
}
