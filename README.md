# Boston Camp Finder

Biweekly-updated aggregator of kids' camps near Roslindale, MA.

**Live site:** https://bostoncampfinder.com

Data is scraped every other Sunday from 16 Boston-area organizations using Claude for extraction.
To add a new source, add one entry to `scraper/sources.py`.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | Static HTML/CSS/JS (`index.html`) |
| Hosting | Vercel (deployed from `main`) |
| API | Vercel Serverless Functions (`api/`) |
| Database | Neon Postgres (via Vercel Storage integration) |
| Scraper | Python + Claude API (runs via GitHub Actions) |

The feedback form at the bottom of the page posts to `/api/submit`, which validates the payload and writes it to a `submissions` table in Neon. Submissions are reviewed directly in the [Neon console](https://console.neon.tech).

## Setup

1. Fork or clone the repo
2. Connect the repo to [Vercel](https://vercel.com) (Framework: Other, Output Directory: `.`)
3. Add a Neon Postgres store via Vercel Storage — Vercel auto-injects `DATABASE_URL`
4. Run `api/schema.sql` in the Neon SQL editor to create the `submissions` table
5. Add your `ANTHROPIC_API_KEY` as a GitHub Actions secret (Settings → Secrets → Actions)
6. Trigger the first scrape manually: Actions → Scrape Camp Data → Run workflow

## Development

```bash
npm install           # install test runner
node --test api/validate.test.js   # 9 unit tests (API validation)
python3 -m pytest                  # 31 scraper tests
```
