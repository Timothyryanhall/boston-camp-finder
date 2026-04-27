import { NavLink, Outlet } from 'react-router-dom';

const navClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-3 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-teal-900 text-white' : 'text-sand-700 hover:bg-white/70',
  ].join(' ');

export default function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_35%),linear-gradient(180deg,_#fbf8f3_0%,_#f3ece2_100%)] text-sand-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">
              Summer planning
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              Boston Camp Finder
            </p>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navClassName}>
              Finder
            </NavLink>
            <NavLink to="/admin" className={navClassName}>
              Admin
            </NavLink>
          </nav>
        </header>

        <main className="flex-1 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
