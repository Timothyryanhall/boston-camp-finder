# Saved UI Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the save column explicit and prevent saved-only mode from trapping users after clearing saved camps.

**Architecture:** Keep the change in `index.html`. Render the saved panel when saved-only mode is active, reset saved-only mode on clear, and label the list save column.

**Tech Stack:** Static HTML, inline Babel React, existing Node/Python checks.

---

## Task 1: Smoke Test

**Files:**
- Create: `tmp/saved-ui-followup-smoke.mjs`
- Modify: none

- [x] **Step 1: Write failing smoke test**

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('index.html', 'utf8');

assert.match(html, /\{savedIds\.size > 0 \|\| showSavedOnly\) && \(/);
assert.match(html, /onClick=\{\(\) => \{ setSavedIds\(new Set\(\)\); setShowSavedOnly\(false\); \}\}/);
assert.match(html, /\{showSavedOnly \? '★ Showing saved only' : savedIds\.size > 0 \? '☆ Show saved only' : 'Show all camps'\}/);
assert.match(html, /\{showSavedOnly && savedIds\.size === 0 && \(/);
assert.match(html, /\{savedIds\.size > 0 && \(/);
assert.match(html, /\['Camp', 'Ages', 'Cost \/ wk', 'Distance', '', 'Save'\]/);
```

- [x] **Step 2: Run smoke test and confirm red**

Run: `node tmp/saved-ui-followup-smoke.mjs`

Expected: FAIL before implementation.

## Task 2: Implement UI Fix

**Files:**
- Modify: `index.html`
- Test: `node tmp/saved-ui-followup-smoke.mjs`

- [x] **Step 1: Keep saved panel visible in saved-only empty state**

Change:

```jsx
{savedIds.size > 0 && (
```

To:

```jsx
{(savedIds.size > 0 || showSavedOnly) && (
```

- [x] **Step 2: Reset saved-only mode when clearing**

Change the clear button to:

```jsx
<button onClick={() => { setSavedIds(new Set()); setShowSavedOnly(false); }} ...>
```

- [x] **Step 3: Give the zero-saved saved-only state an escape hatch**

Use button text:

```jsx
{showSavedOnly ? '★ Showing saved only' : savedIds.size > 0 ? '☆ Show saved only' : 'Show all camps'}
```

Render this note below the toggle:

```jsx
{showSavedOnly && savedIds.size === 0 && (
  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
    No camps are saved. Showing all camps will restore your filtered results.
  </div>
)}
```

Only show copy/print buttons when `savedIds.size > 0`.

- [x] **Step 4: Add list header label**

Change the list header array to:

```js
['Camp', 'Ages', 'Cost / wk', 'Distance', '', 'Save']
```

## Task 3: Verify and Commit

**Files:**
- Modify: `index.html`
- Modify: `docs/superpowers/plans/2026-04-27-saved-ui-followup.md`

- [x] **Step 1: Run smoke test**

Run: `node tmp/saved-ui-followup-smoke.mjs`

Expected: PASS.

- [x] **Step 2: Run API tests**

Run: `node --test api/validate.test.js`

Expected: PASS.

- [x] **Step 3: Run scraper tests**

Run: `python3 -m pytest`

Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add index.html docs/superpowers/plans/2026-04-27-saved-ui-followup.md
git commit -m "fix: improve saved-only empty state"
```
