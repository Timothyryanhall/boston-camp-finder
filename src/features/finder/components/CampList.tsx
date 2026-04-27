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
      <div className="sticky top-[118px] z-10 border-b-[1.5px] border-stone-200 bg-sand-100 px-4 py-2 lg:top-[61px]">
        <div className="flex items-center justify-between sm:hidden">
          <div className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Camp
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 text-center text-[10px] font-semibold tracking-tight text-stone-500">
              Open
            </div>
            <div className="w-10 text-center text-[10px] font-semibold tracking-tight text-stone-500">
              Fav
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[1fr_90px_100px_80px_32px_48px] gap-3 sm:grid">
          <div className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Camp
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Ages
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Cost / wk
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Distance
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Link
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Save
          </div>
        </div>
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
