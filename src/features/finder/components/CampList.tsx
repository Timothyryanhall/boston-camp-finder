import type { Camp } from '../types';

import CampCard from './CampCard';

interface CampListProps {
  camps: Camp[];
  selectedCampId: string | null;
  savedCampIds: Set<string>;
  onSelectCamp: (campId: string) => void;
  onToggleSavedCamp: (campId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
}

export default function CampList({
  camps,
  selectedCampId,
  savedCampIds,
  onSelectCamp,
  onToggleSavedCamp,
  emptyTitle,
  emptyDescription,
}: CampListProps) {
  if (camps.length === 0) {
    return (
      <section className="rounded-[28px] border border-dashed border-sand-200 bg-white/80 p-8 text-center shadow-card">
        <h2 className="text-xl font-black tracking-tight text-sand-900">{emptyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-sand-700">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-sand-900">Camp list</h2>
        <p className="text-sm text-sand-700">{camps.length} results</p>
      </div>

      <div className="grid gap-4">
        {camps.map((camp) => (
          <CampCard
            key={camp.id}
            camp={camp}
            isSelected={camp.id === selectedCampId}
            isSaved={savedCampIds.has(camp.id)}
            onSelect={onSelectCamp}
            onToggleSaved={onToggleSavedCamp}
          />
        ))}
      </div>
    </section>
  );
}

