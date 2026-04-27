## Boston Camp Finder Frontend Foundation Design

Date: 2026-04-27

## Overview

Boston Camp Finder has outgrown its current single-file frontend structure. The product should migrate from the inline React/Babel implementation in `index.html` to a modern frontend stack that preserves the current user experience while creating a cleaner foundation for future UI iteration, testing, and an eventual admin surface.

The migration should prioritize architecture first, with selective cleanup during the move. The public finder experience should remain recognizable, while the codebase gains proper module boundaries, typed data flow, route structure, and a styling system that supports faster visual experimentation later.

## Goals

- Migrate the frontend to `Vite + React + TypeScript + React Router + Tailwind CSS`
- Preserve the current finder layout and behavior closely enough to avoid a redesign project
- Improve internal structure so future UI changes are easier to make and test
- Clean up a few existing rough spots during migration, especially in the filter bar and component boundaries
- Establish routing and layout patterns that make a future admin view straightforward to add
- Add a lightweight but real frontend testing setup for core logic and interaction regressions

## Non-Goals

- Major visual redesign during the migration
- Building the admin experience now
- Adding user accounts or complex family-planning workflows
- Replacing the current data source architecture during this migration
- Introducing server-side rendering or a heavier full-stack framework

## Stack Decision

The frontend will use:

- `Vite` for local development, builds, and modern module tooling
- `React` for UI composition
- `TypeScript` for typed data models, helpers, and component contracts
- `React Router` for route structure and future expansion
- `Tailwind CSS` for styling and faster UI iteration
- `Vitest` and `@testing-library/react` for automated frontend tests

This stack is intentionally lighter than Next.js. The current product is a client-heavy finder UI with a small API surface and no strong present need for server rendering, server components, or SEO-driven route generation. React Router provides enough structure to support a future `/admin` route and additional screens without taking on framework complexity that the product does not yet need.

## Architecture

The app becomes a small SPA with route-level separation between current and future surfaces:

- `/` serves the public camp finder
- `/admin` is reserved for a future internal interface, but may initially be a placeholder route or omitted from navigation while the route structure is still established

The app should load client-side data from the existing sources:

- `data.json` for finder records
- Existing API endpoints for feedback or validation workflows where applicable

The migration should preserve the current deployment model unless implementation details require a small change. If Vercel continues serving the project cleanly, that is acceptable. If the final structure needs a dedicated frontend build output, that change should remain operationally simple and documented.

The architectural emphasis is separation of concerns:

- App shell and routing are isolated from feature logic
- Finder feature logic is isolated from shared UI building blocks
- Data access and normalization are isolated from rendering
- Pure filter/sort/share helpers are isolated from React components

## Project Structure

The frontend should move into a conventional `src/` layout with focused modules. Exact filenames may vary, but the shape should be close to:

```text
src/
  app/
    App.tsx
    router.tsx
    providers/
  routes/
    FinderPage.tsx
    AdminPage.tsx
  features/
    finder/
      components/
      hooks/
      state/
      types.ts
  components/
    ui/
  lib/
    camps/
    filters/
    saved/
    share/
    utils/
  styles/
    globals.css
```

The exact split should stay pragmatic. The goal is not abstract purity; it is to prevent the current single-file sprawl from reappearing in a different form.

## Component Design

The finder should be decomposed into clear, testable UI units. Expected components include:

- `FinderLayout`
- `FilterBar`
- `ResultsSummary`
- `CampList`
- `CampCard`
- `CampDetailPanel`
- `MapPanel`
- `SavedControls`

Reusable primitives that are not finder-specific should live under shared UI components, such as:

- buttons
- badges
- pills
- drawers
- cards
- panels

Selective cleanup during migration should focus on places where current JSX, styling, and behavior are too interwoven. The filter bar is the main candidate: it should become easier to read, easier to restyle, and easier to test without changing its core behavior unnecessarily.

## Data Flow

State management should remain deliberately simple at this stage.

- Route-level finder state uses React state and custom hooks
- Filtering, sorting, formatting, and URL synchronization live in pure helper modules
- Saved camp persistence stays local-first through a small local storage adapter
- Data loading is handled through a typed adapter that reads and normalizes camp data before it reaches the UI

The core principle is that components should consume already-shaped data and avoid carrying normalization or persistence logic inline.

This typed adapter layer creates a stable seam for later changes. If the project eventually moves from static JSON to more API-backed admin editing workflows, the rendering layer should require only limited changes.

## Styling Approach

Tailwind CSS will be the default styling system. The migration should not translate every existing inline style into a one-to-one utility dump without thought. Instead:

- shared visual tokens should be expressed cleanly through Tailwind theme configuration where appropriate
- repeated patterns should become reusable components or small composition helpers
- a small global stylesheet can remain for true global concerns

The immediate visual goal is continuity plus cleanup, not reinvention. After migration, the new structure should make it easier to try different visual directions without reopening architecture decisions.

## Error Handling

The frontend should explicitly support:

- loading state for initial data fetches
- empty-result states after filtering
- fetch failure messaging for `data.json` or API-driven actions
- malformed-data fallback behavior where normalization detects invalid records

Error handling should be visible and intentional, especially because the app depends on generated data that may occasionally be incomplete or stale.

## Testing

The migration should establish a real frontend test baseline:

- `Vitest` for test running
- `Testing Library` for component behavior tests

Initial tests should focus on:

- pure filter and sort utilities
- URL state synchronization helpers
- saved-camp persistence helpers
- a small set of high-value UI interactions, especially filter behavior and saved/share controls

The purpose is to protect the parts most likely to regress during future UI experimentation, not to chase exhaustive coverage.

## Rollout Strategy

The migration should be implemented as a controlled lift-and-shift with selective cleanup:

1. Scaffold the new frontend stack and route shell
2. Move the current finder into structured React components
3. Introduce typed data adapters and utility modules
4. Rebuild styling in Tailwind while keeping the interface broadly familiar
5. Add a small automated test baseline
6. Verify parity on the current main finder flows before introducing future design experiments

This sequence keeps architecture work and product-change risk understandable. It also avoids coupling the migration to a broad visual redesign.

## Risks And Constraints

- A migration can create accidental regressions even when the visual target is continuity
- Tailwind can become messy if repeated patterns are not consolidated intentionally
- TypeScript migration may expose inconsistencies in current data shape that require normalization decisions
- Routing and build changes may require small deployment adjustments

These are acceptable risks, but they should be managed explicitly during implementation and verification.

## Success Criteria

The migration is successful when:

- the app runs in the new stack with the current finder experience intact
- the public route remains easy to use on desktop and mobile
- the codebase is broken into understandable, reusable modules instead of a single large file
- camp data is typed and normalized before rendering
- a future admin route can be added without restructuring the app again
- core finder logic and a few critical UI behaviors are covered by automated tests

