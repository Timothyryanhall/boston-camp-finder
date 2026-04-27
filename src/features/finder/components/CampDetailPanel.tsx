import type { Camp } from '../types';

interface CampDetailPanelProps {
  camp: Camp | null;
  isSaved: boolean;
  isVisibleInResults: boolean;
  onToggleSaved: (campId: string) => void;
}

export default function CampDetailPanel({
  camp,
  isSaved,
  isVisibleInResults,
  onToggleSaved,
}: CampDetailPanelProps) {
  if (camp == null) {
    return (
      <section className="rounded-[28px] border border-sand-200 bg-white/90 p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
          Camp detail
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-sand-900">
          Nothing selected
        </h2>
        <p className="mt-2 text-sm leading-6 text-sand-700">
          Select a camp from the list to inspect dates, cost, and links.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-sand-200 bg-white/90 p-5 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
        Camp detail
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-sand-900">{camp.name}</h2>
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

      {!isVisibleInResults ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This camp is outside the current filter set, but its details are still
          available here.
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 text-sm text-sand-700">
        <div>
          <dt className="font-semibold text-sand-900">Neighborhood</dt>
          <dd>{camp.neighborhood || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Address</dt>
          <dd>{camp.address || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Age range</dt>
          <dd>{camp.ageRange || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Weeks</dt>
          <dd>{camp.weeksLabel || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Hours</dt>
          <dd>{camp.hoursLabel || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Cost</dt>
          <dd>{camp.costLabel || 'Not listed'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sand-900">Financial aid</dt>
          <dd>
            {camp.financialAidAvailable == null
              ? 'Not listed'
              : camp.financialAidAvailable
                ? 'Available'
                : 'Not available'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        {camp.websiteUrl ? (
          <a
            className="inline-flex items-center justify-center rounded-full bg-teal-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            href={camp.websiteUrl}
            target="_blank"
            rel="noreferrer"
          >
            Visit website
          </a>
        ) : null}
        {camp.signupUrl ? (
          <a
            className="inline-flex items-center justify-center rounded-full border border-sand-200 px-4 py-2 text-sm font-semibold text-sand-700 transition hover:bg-sand-50"
            href={camp.signupUrl}
            target="_blank"
            rel="noreferrer"
          >
            Signup link
          </a>
        ) : null}
      </div>
    </section>
  );
}
