# Handoff — Feedback Form + Vercel Migration

**Date:** 2026-04-25  
**Status:** Code complete, manual deployment steps remain

---

## What was done

PR #12 is open and ready to merge: `feat/feedback-form-api`  
https://github.com/Timothyryanhall/boston-camp-finder/pull/12

All automatable tasks are complete and reviewed:

| Task | Status |
|------|--------|
| `package.json` + `vercel.json` | ✅ Done |
| `api/schema.sql` (DB migration) | ✅ Done (needs manual run in Neon) |
| `api/validate.js` + 9 unit tests | ✅ Done |
| `api/submit.js` (serverless handler) | ✅ Done |
| `FeedbackBox` component in `index.html` | ✅ Done |
| Vercel deploy + Neon integration | ⏳ Manual steps below |
| Domain + GitHub Pages cutover | ⏳ Manual steps below |

---

## To pick this up: manual steps

Do these **in order** after merging PR #12.

### 1. Connect repo to Vercel
- Go to vercel.com → Add New Project → import `timothyryanhall/boston-camp-finder`
- Framework Preset: **Other**
- Root Directory: `.` (default)
- Build Command: (leave empty)
- Output Directory: `.`
- Click Deploy — visit the `.vercel.app` URL and confirm the camp finder loads

### 2. Add Neon Postgres
- Vercel project → **Storage** tab → Add Store → **Neon Postgres**
- Create a new database (free tier)
- Vercel auto-injects `DATABASE_URL` into your project env vars

### 3. Run the DB migration
- Go to console.neon.tech → your database → SQL Editor
- Paste and run the contents of `api/schema.sql`
- Confirm `submissions` table appears in Tables view

### 4. Redeploy and smoke-test
```bash
# Should return {"ok":true}
curl -s -X POST https://<your-vercel-url>.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"suggestion","camp_name":"Test Camp","notes":"smoke test"}'

# Should return {"error":"type must be..."}
curl -s -X POST https://<your-vercel-url>.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"bad"}'
```
Then delete the test row in Neon: `DELETE FROM submissions WHERE camp_name = 'Test Camp';`

### 5. Purchase the domain
- Vercel project → Settings → Domains → Add → search `bostoncampfinder.com`
- Vercel handles DNS automatically

### 6. Disable GitHub Pages
- GitHub repo → Settings → Pages → Source: **None** → Save

### 7. Close old PR
```bash
gh -R timothyryanhall/boston-camp-finder pr close 11 \
  --comment "Superseded by #12 — Vercel API + Neon Postgres approach, no GitHub account required."
```

---

## Reviewing submissions (once live)

Query directly in [Neon console](https://console.neon.tech):

```sql
SELECT * FROM submissions ORDER BY created_at DESC;
```

---

## Running tests locally

```bash
cd /Users/timothyhall/Projects/boston-camp-finder
node --test api/validate.test.js   # 9 tests
python3 -m pytest                  # 31 scraper tests
```

---

## Worktree location

The implementation branch lives at:
```
/Users/timothyhall/Projects/boston-camp-finder/.worktrees/feedback-form-api
```
Branch: `feat/feedback-form-api`

To continue working in it:
```bash
cd /Users/timothyhall/Projects/boston-camp-finder/.worktrees/feedback-form-api
```

---

## What's deferred (GitHub issues)

- **Component breakdown + Vite migration** → issue #6 (decision: use Vite, split index.html into component files)
- **Favorites/bookmarking + export** → discussed but not specced; pure frontend feature, no backend needed
- **Input length limits / rate limiting** → deferred until spam is observed
