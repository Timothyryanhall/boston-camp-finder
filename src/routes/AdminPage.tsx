export default function AdminPage() {
  return (
    <section className="rounded-[32px] border border-dashed border-sand-200 bg-white/85 p-8 shadow-card backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-800">
        Internal route
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-sand-900">
        Admin
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-sand-700">
        Placeholder route for internal tools. The public finder remains on the
        root path.
      </p>
    </section>
  );
}
