import { useState } from 'react';

type Tab = 'suggest' | 'feedback';
type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputCls =
  'w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-sans outline-none transition focus:border-teal-500 focus:bg-white';
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.06em] text-stone-400 mb-1.5';

export default function FeedbackBox() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('suggest');
  const [campName, setCampName] = useState('');
  const [campUrl, setCampUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function reset() {
    setCampName('');
    setCampUrl('');
    setNotes('');
    setStatus('idle');
    setErrorMsg('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const body =
      tab === 'suggest'
        ? { type: 'suggestion', camp_name: campName, camp_url: campUrl, notes }
        : { type: 'feedback', notes };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatus('success');
        reset();
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="border-t border-stone-100 px-4 py-3">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); reset(); }}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
          Suggest a camp
        </span>
        <span className="text-stone-300 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3">
          {status === 'success' ? (
            <div className="rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-700">
              Thanks! We'll take a look.{' '}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => { setStatus('idle'); }}
              >
                Submit another
              </button>
            </div>
          ) : (
            <>
              {/* Tab toggle */}
              <div className="mb-3 flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs font-semibold">
                {(['suggest', 'feedback'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); reset(); }}
                    className={[
                      'flex-1 rounded-md py-1 transition',
                      tab === t
                        ? 'bg-white text-stone-700 shadow-sm'
                        : 'text-stone-400 hover:text-stone-600',
                    ].join(' ')}
                  >
                    {t === 'suggest' ? 'Suggest a camp' : 'Leave feedback'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                {tab === 'suggest' ? (
                  <>
                    <div>
                      <label className={labelCls}>Camp name</label>
                      <input
                        className={inputCls}
                        type="text"
                        placeholder="e.g. Sunrise Adventure Camp"
                        value={campName}
                        onChange={(e) => setCampName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Website (optional)</label>
                      <input
                        className={inputCls}
                        type="url"
                        placeholder="https://..."
                        value={campUrl}
                        onChange={(e) => setCampUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Notes (optional)</label>
                      <textarea
                        className={`${inputCls} resize-none`}
                        rows={2}
                        placeholder="Anything else we should know?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className={labelCls}>Your feedback</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder="What's working? What's missing?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}

                {status === 'error' && (
                  <p className="text-xs text-rose-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending…' : 'Submit'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
