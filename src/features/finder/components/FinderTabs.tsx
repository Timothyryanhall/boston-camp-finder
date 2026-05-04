interface FinderTabsProps {
  activeTab: 'browse' | 'saved';
  savedCount: number;
  onTabChange: (tab: 'browse' | 'saved') => void;
}

export default function FinderTabs({ activeTab, savedCount, onTabChange }: FinderTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1">
      {(['browse', 'saved'] as const).map((tab) => {
        const isActive = activeTab === tab;
        const label =
          tab === 'browse'
            ? 'Browse'
            : savedCount > 0
              ? `Saved (${savedCount})`
              : 'Saved';

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={[
              'flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition',
              isActive
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
