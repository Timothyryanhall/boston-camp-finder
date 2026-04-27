# Saved UI Follow-up Design

## Goal

Fix two small issues found in UI testing after the favorites/share/print feature shipped:

- The list layout needs a visible column header above the save star buttons.
- Clearing saved camps while "show saved only" is active should not leave the page stuck showing zero results with no visible way back.

## Scope

- Keep the implementation in `index.html`.
- Do not change the frontend architecture, API, scraper, data, database, or deployment settings.
- Do not introduce a new build step or frontend test framework.

## Behavior

- The list header will label the star column as `Save`.
- The saved panel will render when either there are saved camps or saved-only mode is active.
- Clicking `Clear all` will clear saved IDs and also turn off saved-only mode.
- In saved-only mode with zero saved camps, the panel remains visible and provides an escape hatch by letting the user switch back to all camps.

## Testing

- Add a temporary smoke check that fails against the current markup and passes after the UI change.
- Run the existing API and scraper test suites after implementation.
