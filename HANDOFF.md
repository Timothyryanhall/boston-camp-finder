# Handoff — Favorites / Share / Print Feature

**Date:** 2026-04-27  
**Branch:** main  
**Status:** In progress — partially implemented in `index.html`

---

## What this feature does

Users can star camps to build a saved list, then:
- **Copy link** → shareable URL (`?shared=id1,id2,...`) that pre-loads those camps for a friend
- **Print** → `window.print()` with a print-only section showing only saved camps, formatted cleanly
- **Show saved only** toggle → filters the main list to starred camps

---

## What's done (already in `index.html`)

| Item | Status |
|------|--------|
| Print CSS (`.print-only`, `@media print`) | ✅ |
| `campId(camp)` helper — stable hash of org\|name | ✅ |
| `SaveButton` component — star toggle button | ✅ |
| `CampCardComfortable` — accepts `saved`/`onToggleSave`, has `SaveButton` | ✅ |
| `CampCardCompact` — signature + `position: relative` on article | ⚠️ half done — `SaveButton` not yet added to JSX |
| `CampCardList` — untouched | ❌ |
| `App` state + effects + share logic | ❌ |
| Sidebar saved section | ❌ |
| Shared-mode banner in results | ❌ |
| Print-only section at bottom of App | ❌ |

---

## Resume here: remaining steps in order

### 1. Finish `CampCardCompact` — add SaveButton

In `CampCardCompact`, add the SaveButton as an absolutely-positioned sibling of the expand button (same pattern as `CampCardComfortable`). Insert it right after the closing `</button>` tag of the expand button, before `{open && ...}`:

```jsx
      <SaveButton saved={saved} onToggleSave={onToggleSave} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }} />
```

Also add `paddingRight: 36` to the inner right `<div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>` so the chevron doesn't sit under the star.

---

### 2. `CampCardList` — wrap in flex + sibling star button

The list card's entire header is a `<button>`, so the star must be a sibling (not nested). Restructure the article body:

```jsx
<article style={{ background: T.panel, borderBottom: `1px solid ${T.borderLight}` }}>
  <div style={{ display: 'flex', alignItems: 'stretch' }}>
    <button
      onClick={() => setOpen(o => !o)}
      style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 90px 100px 80px 32px',
        gap: 12, alignItems: 'center',
        padding: '11px 16px',
        background: open ? T.subtle : 'none',
        border: 'none', cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
        transition: 'background 0.15s',
      }}
    >
      {/* existing 5 columns unchanged */}
    </button>
    <SaveButton
      saved={saved} onToggleSave={onToggleSave}
      style={{ margin: 'auto 10px', flexShrink: 0 }}
    />
  </div>
  {open && ( /* expanded section unchanged */ )}
</article>
```

Also update the list header (around line 1160 in the original, now ~1200 after edits) — add a 48px spacer div to the right of the header grid so columns stay aligned:

```jsx
{effectiveLayout === 'list' && filtered.length > 0 && (
  <div style={{ display: 'flex', alignItems: 'center', background: T.subtle, borderRadius: `${T.radiusSm} ${T.radiusSm} 0 0`, border: `1.5px solid ${T.border}`, borderBottom: 'none', position: 'sticky', top: 67, zIndex: 10 }}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 90px 100px 80px 32px', gap: 12, padding: '8px 16px' }}>
      {['Camp', 'Ages', 'Cost / wk', 'Distance', ''].map((h, i) => (
        <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted, textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
      ))}
    </div>
    <div style={{ width: 48 }} />
  </div>
)}
```

---

### 3. `App` — add state, effects, functions

Add these after the existing `useState` declarations (around line 850):

```js
// Saved camps
const [savedIds, setSavedIds] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('shared');
  if (shared) return new Set(shared.split(',').filter(Boolean));
  try {
    const stored = localStorage.getItem('bcf_saved');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
});
const [sharedMode] = useState(() => new URLSearchParams(window.location.search).has('shared'));
const [showSavedOnly, setShowSavedOnly] = useState(false);
const [copyStatus, setCopyStatus] = useState('idle');
```

Add these after the existing `useEffect` for data loading:

```js
// Clean shared param from URL after reading
useEffect(() => {
  if (new URLSearchParams(window.location.search).has('shared')) {
    history.replaceState(null, '', window.location.pathname);
  }
}, []);

// Persist to localStorage
useEffect(() => {
  try { localStorage.setItem('bcf_saved', JSON.stringify([...savedIds])); } catch {}
}, [savedIds]);
```

Add these functions (before the `return`):

```js
function toggleSaved(camp) {
  const id = campId(camp);
  setSavedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}

function copyShareLink() {
  const ids = [...savedIds].join(',');
  if (!ids) return;
  const url = `${window.location.origin}${window.location.pathname}?shared=${ids}`;
  navigator.clipboard.writeText(url).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }).finally(() => {
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  });
  navigator.clipboard.writeText(url).then(() => {
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }).catch(() => {});
}

const savedCampsList = camps.filter(c => savedIds.has(campId(c)));
```

Update the `filtered` line to respect `showSavedOnly`:

```js
const filtered = (selectedOrg ? withoutOrg.filter(c => c.organization === selectedOrg) : withoutOrg)
  .filter(c => !showSavedOnly || savedIds.has(campId(c)))
  .sort((a, b) => compareCamps(a, b, sortMode));
```

---

### 4. Sidebar — add saved section

Insert this just above `<FeedbackBox />` in the sidebar scroll area:

```jsx
{/* Saved camps panel */}
{savedIds.size > 0 && (
  <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber }}>
        ★ Saved ({savedIds.size})
      </span>
      <button onClick={() => setSavedIds(new Set())} style={{ fontSize: 11, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
        Clear all
      </button>
    </div>
    <button onClick={() => setShowSavedOnly(o => !o)} style={{
      width: '100%', padding: '7px 10px', marginBottom: 6,
      border: `1.5px solid ${showSavedOnly ? T.amber : T.border}`,
      borderRadius: T.radiusSm, background: showSavedOnly ? T.amberLight : 'none',
      color: showSavedOnly ? T.amber : T.ink,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    }}>{showSavedOnly ? '★ Showing saved only' : '☆ Show saved only'}</button>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <button onClick={copyShareLink} style={{
        padding: '7px 10px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
        background: copyStatus === 'copied' ? T.greenLight : 'none',
        color: copyStatus === 'copied' ? T.green : T.ink,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
      }}>{copyStatus === 'copied' ? '✓ Copied!' : '🔗 Copy link'}</button>
      <button onClick={() => window.print()} style={{
        padding: '7px 10px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
        background: 'none', color: T.ink,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>🖨 Print</button>
    </div>
  </div>
)}
```

---

### 5. Results — shared-mode banner + pass props to cards

Insert before the "Result count + list header" div:

```jsx
{sharedMode && (
  <div style={{
    background: T.tealLight, border: `1.5px solid ${T.teal}44`,
    borderRadius: T.radiusSm, padding: '10px 14px', marginBottom: 16,
    fontSize: 13, color: T.tealDark,
  }}>
    <span style={{ fontWeight: 700 }}>Viewing a shared list</span> — {savedIds.size} saved camp{savedIds.size !== 1 ? 's' : ''}.
    Add or remove camps, then copy your own link.
  </div>
)}
```

Update the card render to pass `saved` and `onToggleSave`:

```jsx
{filtered.map((camp, i) => (
  <CampCard key={i} camp={camp} accent={accent}
    saved={savedIds.has(campId(camp))}
    onToggleSave={() => toggleSaved(camp)}
  />
))}
```

---

### 6. Print-only section

Add just before the closing `</div>` of the App return (after the `<footer>`):

```jsx
<div className="print-only">
  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px 40px', maxWidth: 680 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1917' }}>Boston Camp Finder</h1>
      <span style={{ fontSize: 12, color: '#78716c' }}>bostoncampfinder.com</span>
    </div>
    <p style={{ fontSize: 12, color: '#78716c', marginBottom: 28, borderBottom: '1px solid #e8e0d6', paddingBottom: 16 }}>
      Saved camps — {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
    {savedCampsList.map((camp, i) => {
      const url = safeUrl(camp.signup_url || camp.website_url);
      return (
        <div key={i} style={{ marginBottom: 22, paddingBottom: 22, borderBottom: '1px solid #e8e0d6' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 1 }}>{camp.camp_name}</div>
          <div style={{ color: '#78716c', fontSize: 13, marginBottom: 6 }}>{camp.organization}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 20px', fontSize: 12, color: '#44403c' }}>
            {camp.age_range && <span><b>Ages:</b> {camp.age_range}</span>}
            {camp.cost_per_week && <span><b>Cost:</b> {camp.cost_per_week}</span>}
            {camp.weeks_available && <span><b>When:</b> {camp.weeks_available}</span>}
            {camp.neighborhood && <span><b>Location:</b> {camp.neighborhood}</span>}
            {camp.hours_of_day && <span><b>Hours:</b> {camp.hours_of_day}</span>}
            {camp.financial_aid_available === true && <span style={{ color: '#16a34a', fontWeight: 600 }}>Financial aid available</span>}
          </div>
          {url && <div style={{ fontSize: 12, marginTop: 4, color: '#2563eb' }}>{url}</div>}
        </div>
      );
    })}
    <p style={{ fontSize: 10, color: '#a8a29e', marginTop: 16 }}>
      Always verify dates, pricing, and availability directly with each camp before registering.
    </p>
  </div>
</div>
```

---

## Design decisions already made

- Camp IDs are a djb2 hash of `organization|camp_name` — stable across scrapes as long as name/org don't change
- Shared URLs use `?shared=id1,id2,...` query param; cleaned from URL via `history.replaceState` after reading
- Saved list persists in `localStorage` under key `bcf_saved`
- Print uses CSS `visibility: hidden` trick so the print-only section shows even though it's `display: none` on screen
- Star is absolutely positioned over the card header (not nested inside the expand `<button>`) — valid HTML, z-index 2 takes click priority
- List layout uses sibling button approach instead (can't absolutely position cleanly in a grid row)

---

## Other open items (unrelated to this feature)

- Base Camp (`scoutingboston.org`): run `UPDATE submissions SET camp_url = 'https://www.scoutingboston.org/', scrape_status = NULL, scraped_at = NULL WHERE camp_name = 'Base Camp';` in Neon to queue it for next scrape
- Smoke test row: confirm `DELETE FROM submissions WHERE camp_name = 'Test Camp';` was run in Neon
