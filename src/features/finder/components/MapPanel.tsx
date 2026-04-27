import type { Camp } from '../types';

interface MapPanelProps {
  camps: Camp[];
  selectedCamp: Camp | null;
}

export default function MapPanel({ camps, selectedCamp }: MapPanelProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-sand-200 bg-white/90 shadow-card">
      <div className="border-b border-sand-200 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
          Map preview
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-sand-900">
          Finder map placeholder
        </h2>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="relative min-h-72 overflow-hidden rounded-[24px] border border-sand-200 bg-[linear-gradient(135deg,_rgba(13,148,136,0.1),_rgba(255,255,255,0.9))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(217,119,6,0.18),transparent_20%),radial-gradient(circle_at_80%_70%,rgba(13,148,136,0.18),transparent_18%)]" />
          <div className="absolute inset-4 rounded-[20px] border border-dashed border-teal-200/70" />
          <div className="absolute left-1/4 top-1/4 h-4 w-4 rounded-full bg-teal-700 shadow-[0_0_0_12px_rgba(13,148,136,0.14)]" />
          <div className="absolute right-1/3 top-1/2 h-4 w-4 rounded-full bg-amber-600 shadow-[0_0_0_12px_rgba(217,119,6,0.14)]" />
          <div className="absolute bottom-1/4 left-1/2 h-4 w-4 rounded-full bg-sand-900 shadow-[0_0_0_12px_rgba(42,33,27,0.12)]" />
          <div className="absolute inset-x-0 bottom-0 border-t border-sand-200 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-sand-700">
            Map rendering will be wired in a later task.
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-sand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
              Visible camps
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-sand-900">
              {camps.length}
            </p>
          </div>

          <div className="rounded-2xl border border-sand-200 p-4">
            <p className="text-sm font-semibold text-sand-900">Selected camp</p>
            <p className="mt-1 text-sm leading-6 text-sand-700">
              {selectedCamp
                ? `${selectedCamp.name} in ${selectedCamp.neighborhood || 'Boston'}`
                : 'Pick a camp to anchor the map placeholder.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

