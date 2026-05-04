---
title: Saved Tab — top-level tab replacing sidebar SavedControls
date: 2026-05-03
status: approved
issue: https://github.com/Timothyryanhall/boston-camp-finder/issues/14
---

# Saved Tab

## Overview

Replace the conditionally-rendered `SavedControls` sidebar appendage with a first-class `[ Browse ] [ Saved (N) ]` tab bar. The Saved tab shows all starred camps in a full-width list with copy-link / print / clear controls in a slim action toolbar above the list. The Browse tab is the current experience, unchanged.

## State model changes

`savedOnly` is removed from `FinderFilters` and all associated code:

- `src/features/finder/types.ts` — remove `savedOnly` field
- `src/lib/share/shareState.ts` — remove from `DEFAULT_FINDER_FILTERS`, `parseFinderShareState`, `stringifyFinderShareState`, `hasActiveFinderFilters`
- `src/lib/filters/applyFilters.ts` — remove the `savedOnly` filter line
- `src/features/finder/hooks/useFinderState.ts` — remove `setSavedOnly`, remove `savedOnly` from state and return value; add `savedCamps: Camp[]`

Existing URLs with `?savedOnly=1` degrade gracefully — the param is ignored.

`activeTab: 'browse' | 'saved'` is local `useState` in `FinderLayout`:
- Initializes to `'saved'` when `finder.isSharedMode` is true
- Initializes to `'browse'` otherwise
- No URL sync needed

`useFinderState` gains one new derived value:

```ts
savedCamps: camps.filter(c => savedCampIds.has(c.id))
  .sort((a, b) => a.name.localeCompare(b.name))
```

No browse filters applied. `visibleCamps` is unchanged.

## Tab bar (`FinderTabs` component)

Props: `activeTab`, `savedCount`, `onTabChange`

Renders `[ Browse ]` and `[ Saved (3) ]` pill-style tabs. The saved count badge updates in real time.

**Desktop:** inside `<main>`, above the results list, full-width.

**Mobile:** sticky at `top-[61px]` (`z-30`), just below the app header.

## Browse tab layout

Identical to the current experience. Sidebar has `FilterBar` (with `FeedbackBox`) only — `SavedControls` is removed. The mobile filter bar retains its sticky positioning, offset downward to account for the tab bar height.

## Saved tab layout

**Desktop:** `<aside>` is not rendered — the grid collapses to single-column, full-width list.

**Mobile:** filter bar does not render. No slide-over.

**Above the list:**
- "Viewing a shared list" banner (when `isSharedMode` is true)
- Slim action toolbar: `★ N saved camps` on the left; `Copy link` / `Print` / `Clear all` buttons on the right

**List:** `CampList` renders `savedCamps` (unfiltered starred camps).

**Empty state:** "No saved camps yet. Browse camps and tap ☆ to save them here."

## `SavedControls.tsx` changes

Remove `savedOnly` prop and `onToggleSavedOnly` prop. Remove the "show saved only" toggle button. Keep copy link, print, and clear all. Repurposed as the action toolbar for the Saved tab.

## Shared link behavior

When `?shared=…` is detected, `isSharedMode` is true and `activeTab` initializes to `'saved'` — the user lands directly on the Saved tab showing the shared camps.

## Files affected

| File | Change |
|---|---|
| `src/features/finder/types.ts` | Remove `savedOnly` from `FinderFilters` |
| `src/lib/share/shareState.ts` | Remove `savedOnly` from default, parse, stringify, hasActive |
| `src/lib/filters/applyFilters.ts` | Remove `savedOnly` filter line |
| `src/features/finder/hooks/useFinderState.ts` | Remove `setSavedOnly`; add `savedCamps` |
| `src/features/finder/components/FinderLayout.tsx` | Add tab state, `FinderTabs`, conditional sidebar/layout |
| `src/features/finder/components/FinderTabs.tsx` | New component |
| `src/features/finder/components/SavedControls.tsx` | Remove toggle, narrow props |
| Test files | Update any references to `savedOnly` |
