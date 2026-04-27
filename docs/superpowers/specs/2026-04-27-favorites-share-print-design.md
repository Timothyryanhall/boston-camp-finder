# Favorites, Share, and Print Design

## Goal

Finish the in-progress saved camps feature described in `HANDOFF.md` without doing the broader frontend refactor in the same pass.

Users can save camps, filter the visible list to saved camps, copy a shareable link, and print a clean saved-camps summary.

## Scope

- Keep all implementation in `index.html`.
- Preserve the current static frontend and Vercel deployment model.
- Do not change scraper, API, Neon schema, or deployment config.
- Do not refactor the frontend structure in this pass.

## Behavior

- A camp is identified by the existing `campId(camp)` helper, based on `organization|camp_name`.
- Saved IDs are stored in React state as a `Set`.
- Normal page loads initialize saved IDs from `localStorage` key `bcf_saved`.
- Shared links initialize saved IDs from `?shared=id1,id2,...`.
- After reading a shared link, the app removes the `shared` query parameter from the visible URL with `history.replaceState`.
- Saved IDs persist back to `localStorage`.
- The saved-only toggle filters the current results to saved camps while preserving the existing filters, organization selection, and sort mode.
- Copy link writes a URL with the current saved IDs to the clipboard and shows short copied feedback.
- Print calls `window.print()` and relies on the existing print-only CSS to render a saved-camps summary.

## UI Changes

- Add save buttons to compact and list cards.
- Pass `saved` and `onToggleSave` props to all card layouts.
- Add a saved camps panel above the feedback box in the sidebar when at least one camp is saved.
- Add a shared-mode banner in the results area when the page was opened from a shared link.
- Add a print-only saved camps section near the end of the app markup.
- Keep the current visual style and inline style approach.

## Error Handling

- If `localStorage` read/write fails, continue without crashing.
- If the Clipboard API fails, fall back to a temporary textarea and `document.execCommand('copy')`.
- If no camps are saved, copy and print controls are hidden with the saved panel.

## Testing

- Use the existing project checks for API and scraper regressions:
  - `node --test api/validate.test.js`
  - `python3 -m pytest`
- Run a local static smoke check in a browser to verify that `index.html` renders and the saved/share/print controls are wired.

## Refactor Follow-up

After the feature lands, create separate frontend refactor recommendations or GitHub issues. Likely topics include extracting card components, separating filters/state helpers, adding a browser-level frontend test harness, and deciding whether to keep a no-build setup or introduce a small bundler.
