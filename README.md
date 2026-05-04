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

## Scraper Source Review

Sources live in `scraper/sources.py`. Each source must include:

```python
{"name": "Camp Provider", "url": "https://example.org/summer-camp/"}
```

Optional source controls keep crawling focused:

- `max_pages`: per-source page cap. Use this for directories that need several detail pages without raising the global crawl limit.
- `include_patterns`: URL text that should be prioritized for follow-up crawling, such as `camp`, `summer`, `registration`, `program`, or `rates`.
- `exclude_patterns`: URL text to skip, such as `career`, `donate`, `privacy`, `news`, or unrelated events.
- `allow_external_registration_domains`: registration hosts that are safe to follow when a provider uses a third-party platform.

When reviewing new discovery candidates, prefer the official camp page over a directory listing. Add uncertain or broad regional directories only when they lead to official camp pages and can be bounded with `max_pages` plus include/exclude patterns. After a scrape, check the printed data quality summary for duplicate rows, missing fields, and out-of-scope distances before accepting the refreshed `data.json`.

## Deployment

- `main` deploys to Vercel
- pull requests get Vercel preview deployments
- the scraper runs on a GitHub Actions schedule and commits refreshed `data.json` back to the repo
