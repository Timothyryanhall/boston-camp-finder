import type { Camp } from '../types';

interface ResultsSummaryProps {
  visibleCamps: Camp[];
  totalCount: number;
}

export default function ResultsSummary({ visibleCamps, totalCount }: ResultsSummaryProps) {
  const aidCount = visibleCamps.filter((c) => c.financialAidAvailable === true).length;
  const closeCount = visibleCamps.filter(
    (c) => (c.distanceMiles ?? Infinity) <= 2,
  ).length;
  const latestYear = visibleCamps.reduce<number | null>((best, c) => {
    if (c.dataYear == null) return best;
    return best == null || c.dataYear > best ? c.dataYear : best;
  }, null);

  const stats = [
    { value: visibleCamps.length, label: 'matching camps' },
    { value: aidCount, label: 'with aid' },
    { value: closeCount, label: 'within 2 mi' },
    { value: latestYear ?? '—', label: 'latest data' },
  ];

  void totalCount;

  return (
    <div
      className="grid grid-cols-2 overflow-hidden rounded-xl border border-stone-200 bg-white lg:grid-cols-4"
      style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.05)' }}
    >
      {stats.map(({ value, label }, i) => (
        <div
          key={label}
          className={[
            'p-4',
            i < 3 ? 'border-b border-r border-stone-100 lg:border-b-0' : 'border-b border-stone-100 lg:border-b-0',
            i % 2 === 0 && i < 2 ? '' : '',
          ].join(' ')}
        >
          <div className="text-[22px] font-extrabold leading-none text-stone-900">{value}</div>
          <div className="mt-1 text-[11px] text-stone-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
