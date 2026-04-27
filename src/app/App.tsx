import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-[#d8e0e8]">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1260px] items-start justify-between gap-4 px-6 py-[18px]">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
                Boston Camp Finder
              </h1>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                📍 Roslindale
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Run by Boston-area parents who got tired of digging through scattered camp listings.
            </p>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
