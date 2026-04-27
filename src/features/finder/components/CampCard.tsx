import type { Camp } from '../types';

interface CampCardProps {
  camp: Camp;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (campId: string) => void;
  onToggleSaved: (campId: string) => void;
}

function formatDistance(distanceMiles: number | null): string {
  if (distanceMiles == null) {
    return 'Distance unavailable';
  }

  return `${distanceMiles.toFixed(1)} miles`;
}

export default function CampCard({
  camp,
  isSelected,
  isSaved,
  onSelect,
  onToggleSaved,
}: CampCardProps) {
  return (
    <article
      className={[
        'rounded-[24px] border bg-white/90 p-5 shadow-card transition',
        isSelected ? 'border-teal-400 ring-2 ring-teal-100' : 'border-sand-200',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
            {camp.neighborhood || 'Boston'}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-sand-900">
            {camp.name}
          </h3>
          <p className="mt-1 text-sm text-sand-700">{camp.organization}</p>
        </div>

        <button
          type="button"
          className={[
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            isSaved
              ? 'bg-teal-100 text-teal-900'
              : 'border border-sand-200 text-sand-700 hover:bg-sand-50',
          ].join(' ')}
          onClick={() => onToggleSaved(camp.id)}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {camp.typeTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-sand-700"
          >
            {tag}
          </span>
        ))}
        {camp.financialAidAvailable ? (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
            Financial aid
          </span>
        ) : null}
        {camp.isStale ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            Stale
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-sm text-sand-700 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-sand-900">Age</dt>
          <dd>{camp.ageRange || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Distance</dt>
          <dd>{formatDistance(camp.distanceMiles)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Cost</dt>
          <dd>{camp.costLabel || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Season</dt>
          <dd>{camp.weeksLabel || 'Not listed'}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-teal-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          onClick={() => onSelect(camp.id)}
        >
          View details
        </button>
      </div>
    </article>
  );
}

