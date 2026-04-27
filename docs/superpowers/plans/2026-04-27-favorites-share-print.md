# Favorites Share Print Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish saved camps, share links, saved-only filtering, and print output in the existing static frontend.

**Architecture:** Keep the feature in `index.html` for this pass. Use the existing `campId(camp)` and `SaveButton` helpers, add saved state to `App`, pass saved props into card components, and render sidebar/shared/print UI from the saved ID set.

**Tech Stack:** Static HTML, inline Babel React, browser `localStorage`, browser Clipboard API, existing Node and Python test commands.

---

## File Structure

- Modify `index.html`: complete the feature UI, state, effects, and print-only markup.
- Modify `docs/superpowers/plans/2026-04-27-favorites-share-print.md`: track execution checkboxes.
- Do not modify API, scraper, database, or deployment files.

## Task 1: Add a Frontend Smoke Test Script

**Files:**
- Create: `tmp/frontend-smoke.mjs`
- Modify: none
- Test: `node tmp/frontend-smoke.mjs`

- [ ] **Step 1: Write the failing smoke test**

Create `tmp/frontend-smoke.mjs` with assertions that inspect `index.html` for feature wiring that is missing in the current WIP:

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('index.html', 'utf8');

assert.match(html, /function CampCardList\(\{ camp, accent, saved, onToggleSave \}\)/);
assert.match(html, /const \[savedIds, setSavedIds\] = useState/);
assert.match(html, /const \[sharedMode\] = useState/);
assert.match(html, /function toggleSaved\(camp\)/);
assert.match(html, /function copyShareLink\(\)/);
assert.match(html, /\.filter\(c => !showSavedOnly \|\| savedIds\.has\(campId\(c\)\)\)/);
assert.match(html, /savedIds\.size > 0 &&/);
assert.match(html, /Viewing a shared list/);
assert.match(html, /saved=\{savedIds\.has\(campId\(camp\)\)\}/);
assert.match(html, /onToggleSave=\{\(\) => toggleSaved\(camp\)\}/);
assert.match(html, /className="print-only"/);
assert.match(html, /savedCampsList\.map/);
```

- [ ] **Step 2: Run smoke test to verify it fails**

Run: `node tmp/frontend-smoke.mjs`

Expected: FAIL on missing saved/list/app wiring, proving the current frontend does not yet implement the completed feature.

- [ ] **Step 3: Commit smoke test**

Do not commit this temporary smoke script. It lives in `tmp/`, which is ignored by git.

## Task 2: Complete Card Save Controls

**Files:**
- Modify: `index.html`
- Test: `node tmp/frontend-smoke.mjs`

- [ ] **Step 1: Update `CampCardCompact`**

Add `paddingRight: 36` to the right-side metadata div and add a sibling `SaveButton` after the expand button:

```jsx
<div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, paddingRight: 36 }}>
```

```jsx
<SaveButton saved={saved} onToggleSave={onToggleSave} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }} />
```

- [ ] **Step 2: Update `CampCardList` signature and layout**

Change the signature to:

```jsx
function CampCardList({ camp, accent, saved, onToggleSave }) {
```

Wrap the row button in a flex container and add a sibling `SaveButton`:

```jsx
<article style={{ background: T.panel, borderBottom: `1px solid ${T.borderLight}`, transition: 'background 0.15s' }}>
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
      {/* existing five columns */}
    </button>
    <SaveButton saved={saved} onToggleSave={onToggleSave} style={{ margin: 'auto 10px', flexShrink: 0 }} />
  </div>
  {open && (/* existing expanded content */)}
</article>
```

## Task 3: Add Saved State, Share Logic, and Filtering

**Files:**
- Modify: `index.html`
- Test: `node tmp/frontend-smoke.mjs`

- [ ] **Step 1: Add saved state after existing `useState` declarations in `App`**

```js
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

- [ ] **Step 2: Add effects after data loading**

```js
useEffect(() => {
  if (new URLSearchParams(window.location.search).has('shared')) {
    history.replaceState(null, '', window.location.pathname);
  }
}, []);

useEffect(() => {
  try { localStorage.setItem('bcf_saved', JSON.stringify([...savedIds])); } catch {}
}, [savedIds]);
```

- [ ] **Step 3: Add saved helpers before `return`**

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
  const markCopied = () => {
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };
  navigator.clipboard.writeText(url).then(markCopied).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    markCopied();
  });
}

const savedCampsList = camps.filter(c => savedIds.has(campId(c)));
```

- [ ] **Step 4: Update filtered results**

```js
const filtered = (selectedOrg ? withoutOrg.filter(c => c.organization === selectedOrg) : withoutOrg)
  .filter(c => !showSavedOnly || savedIds.has(campId(c)))
  .sort((a, b) => compareCamps(a, b, sortMode));
```

## Task 4: Add Sidebar, Shared Banner, Card Props, and Print Markup

**Files:**
- Modify: `index.html`
- Test: `node tmp/frontend-smoke.mjs`

- [ ] **Step 1: Add saved sidebar panel above `FeedbackBox`**

Render the saved count, clear button, saved-only toggle, copy link button, and print button when `savedIds.size > 0`.

- [ ] **Step 2: Add shared-mode banner before the result count row**

Render a teal banner when `sharedMode` is true that says `Viewing a shared list` and includes the saved count.

- [ ] **Step 3: Update list header alignment**

Wrap the list header grid in a flex container and add a `width: 48` spacer to align with the new save button column.

- [ ] **Step 4: Pass saved props to cards**

```jsx
<CampCard
  key={i}
  camp={camp}
  accent={accent}
  saved={savedIds.has(campId(camp))}
  onToggleSave={() => toggleSaved(camp)}
/>
```

- [ ] **Step 5: Add print-only saved camps section after the footer**

Render `savedCampsList.map(...)` inside `<div className="print-only">` with camp name, organization, age, cost, dates, location, hours, aid, and URL.

## Task 5: Verify and Commit

**Files:**
- Modify: `index.html`
- Test: existing test suites and local browser smoke check

- [ ] **Step 1: Run frontend smoke test**

Run: `node tmp/frontend-smoke.mjs`

Expected: PASS.

- [ ] **Step 2: Run API tests**

Run: `node --test api/validate.test.js`

Expected: PASS.

- [ ] **Step 3: Run scraper tests**

Run: `python3 -m pytest`

Expected: PASS.

- [ ] **Step 4: Run browser smoke check**

Serve locally with `python3 -m http.server 8010`, open `http://localhost:8010/`, and verify:

- Page renders.
- Star button appears on cards.
- Saving a camp shows the sidebar saved panel.
- Copy link button changes to copied state.
- Saved-only toggle filters visible results.
- Shared URL mode shows the banner.

- [ ] **Step 5: Commit implementation**

```bash
git add index.html docs/superpowers/plans/2026-04-27-favorites-share-print.md
git commit -m "feat: add favorites share print controls"
```

## Self-Review

- Spec coverage: saved IDs, local storage, shared links, URL cleanup, saved-only filtering, copy link fallback, print, sidebar, banner, and card props are covered.
- Placeholder scan: no TBD/TODO placeholders are present.
- Type consistency: all planned names match existing helpers or are introduced in this plan.
