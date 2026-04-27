# Boston Camp Finder

Camp search for Boston-area families, centered on camps near Roslindale.

**Live site:** https://bostoncampfinder.com

Boston Camp Finder is run by Boston-area parents who got tired of digging through scattered camp listings and stale websites.

The site combines a searchable React frontend, a periodic scraper that refreshes `data.json`, and a small feedback API for suggestions and corrections.

Data is scraped every other Sunday from Boston-area organizations using Claude for extraction. To add a new source, add one entry to `scraper/sources.py`.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + TypeScript + React Router + Tailwind (`src/`) |
| Hosting | Vercel |
| API | Vercel Serverless Functions (`api/`) |
| Database | Neon Postgres (via Vercel Storage integration) |
| Scraper | Python + Claude API (runs via GitHub Actions) |
| Data feed | `data.json`, refreshed by the scraper and served to the frontend |

The frontend fetches `/data.json`, renders the camp finder UI, and posts feedback or camp suggestions to `/api/submit`. The feedback endpoint validates submissions and writes them to Neon. Submissions are reviewed directly in the [Neon console](https://console.neon.tech).

## Repository Layout

```text
src/                 React app
api/                 Vercel serverless functions and schema
scraper/             scraper logic and source definitions
tests/               scraper tests
data.json            latest scraped camp data
.github/workflows/   scheduled scrape automation
```

## Setup

1. Clone the repo and install frontend dependencies with `npm install`
2. Connect the repo to [Vercel](https://vercel.com)
3. Add a Neon Postgres store in Vercel Storage so `DATABASE_URL` is available to `/api/submit`
4. Run `api/schema.sql` in the Neon SQL editor to create or update the `submissions` table
5. Add `ANTHROPIC_API_KEY` as a GitHub Actions secret for the scraper workflow
6. Trigger the scrape workflow manually once from GitHub Actions if you need a fresh `data.json`

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run test:run
node --test api/validate.test.js
python3 -m pytest
```

## Deployment

- `main` deploys to Vercel
- pull requests get Vercel preview deployments
- the scraper runs on a GitHub Actions schedule and commits refreshed `data.json` back to the repo
