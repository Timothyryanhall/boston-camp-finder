---
title: Feedback Form + API + Database
date: 2026-04-25
status: approved
---

# Feedback Form, API, and Database

## Overview

Add a user-facing feedback and camp-suggestion form to the sidebar, backed by a Vercel serverless API and Neon Postgres database. Migrate hosting from GitHub Pages to Vercel and purchase `bostoncampfinder.com` through Vercel.

This replaces PR #11 (which used GitHub Issues as the submission target, requiring users to have a GitHub account).

## Scope

**In scope:**
- Vercel deployment setup (replaces GitHub Pages)
- `bostoncampfinder.com` domain (purchased and managed through Vercel)
- `/api/submit` serverless function
- Neon Postgres database with a `submissions` table
- Updated `FeedbackBox` React component (POST to API instead of opening GitHub issue)

**Out of scope:**
- Favorites/bookmarking (deferred)
- Admin UI (review submissions directly in Neon console)
- Component breakdown / Vite migration (tracked in issue #6)
- Rate limiting / CAPTCHA (revisit if spam becomes a problem)

## Architecture

```
bostoncampfinder.com  (Vercel)
├── /                 → serves index.html (static, no changes to content)
├── /api/submit       → Vercel serverless function (Node.js)
└── Neon Postgres     → submissions table (via Vercel marketplace integration)

GitHub repo (unchanged structure)
└── vercel.json       added — routes and build config
└── api/submit.js     added — serverless function
└── index.html        modified — FeedbackBox posts to /api/submit
└── GitHub Actions scraper continues unchanged
```

GitHub Pages is disabled once Vercel deployment is confirmed working.

## Database

**Provider:** Neon Postgres via Vercel marketplace integration (free tier).

**Table: `submissions`**

```sql
CREATE TABLE submissions (
  id         serial primary key,
  type       text        not null check (type in ('suggestion', 'feedback')),
  camp_name  text,
  camp_url   text,
  notes      text,
  created_at timestamptz not null default now()
);
```

Queried directly in the Neon web console (`console.neon.tech`). No admin UI needed.

## API

**`POST /api/submit`**

Request body (JSON):
```json
{
  "type": "suggestion" | "feedback",
  "camp_name": "string (optional)",
  "camp_url": "string (optional)",
  "notes": "string (optional)"
}
```

Validation:
- `type` must be `suggestion` or `feedback`
- At least one of `camp_name`, `camp_url`, or `notes` must be non-empty

Responses:
- `200 { ok: true }` — row written successfully
- `400 { error: "..." }` — validation failure
- `500 { error: "Server error" }` — database write failed

All other HTTP methods return `405 Method Not Allowed`.

No authentication. No CAPTCHA for now.

## Frontend (FeedbackBox component)

Located at the bottom of the filter sidebar. Collapsible panel with a header "Feedback & Suggestions".

**Two modes:**

1. **Suggest a camp** — fields: camp name (required), website URL (optional), notes/textarea (optional). Submits `type: "suggestion"`.
2. **Leave feedback** — single textarea. Submits `type: "feedback"`.

**Behavior:**
- Submit button is disabled until required fields are filled
- On submit: POST to `/api/submit`, show inline confirmation ("Thanks! We'll take a look.") on success
- On error: show inline retry message ("Something went wrong — please try again.")
- No page reload or redirect

UI style matches existing sidebar tokens (`T.border`, `T.muted`, `ACCENT`, etc.).

## Deployment Steps (manual, done once)

1. Connect GitHub repo to Vercel
2. Add Neon Postgres integration in Vercel marketplace; copy `DATABASE_URL` env var
3. Purchase `bostoncampfinder.com` in Vercel domains; add to project
4. Verify deployment, then disable GitHub Pages in repo settings
5. Close PR #11

## Future

- **Spam mitigation:** IP-based rate limiting at Vercel edge, or a hidden honeypot field, if submissions become noisy.
- **Scraper automation:** A future script could read approved rows from `submissions` where `type = 'suggestion'` and `camp_url` is non-null, open a PR adding the URL to `scraper/sources.py`.
- **Favorites + export:** localStorage-based bookmarking with CSV/table export — no backend needed, pure frontend feature (separate PR).
