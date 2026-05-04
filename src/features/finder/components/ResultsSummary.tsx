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

  const stats = [
    { value: visibleCamps.length, label: `of ${totalCount} camps` },
    { value: aidCount, label: 'with aid' },
    { value: closeCount, label: 'within 2 mi' },
  ];

  return (
    <div
      className="grid grid-cols-3 overflow-hidden rounded-xl border border-stone-200 bg-white"
      style={{ boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.05)' }}
    >
      {stats.map(({ value, label }, i) => (
        <div
          key={label}
          className={['p-4', i < 2 ? 'border-r border-stone-100' : ''].join(' ')}
        >
          <div className="text-[22px] font-extrabold leading-none text-stone-900">{value}</div>
          <div className="mt-1 text-[11px] text-stone-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
