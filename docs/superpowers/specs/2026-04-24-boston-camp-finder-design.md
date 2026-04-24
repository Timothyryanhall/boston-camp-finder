# Boston Camp Finder — Design Spec
Date: 2026-04-24

## Overview

A weekly-updated website that aggregates kids' camp information from ~16 Boston-area sources. Parents searching for summer, spring break, or fall break camps near Roslindale get a single filterable table with cost, schedule, signup dates, and direct links — without needing to visit each camp's website individually. Data may be from the current or prior year; stale data is clearly flagged.

## Goals

- Aggregate camp data from 16 known Boston-area sources
- Extract structured data using Claude (AI-powered, not brittle per-site parsers)
- Refresh data weekly via GitHub Actions (free)
- Serve a single static HTML page via GitHub Pages (free)
- Keep architecture simple now; designed to migrate to AWS Lambda + DynamoDB later

## Non-Goals (v1)

- User accounts or saved searches
- Email alerts
- Real-time data
- Crawling beyond 3 hops per source
- Sources outside the initial list

## Architecture

```
GitHub repo (boston-camp-finder)
├── scraper/
│   ├── scraper.py        # main scraper — fetches, calls Claude, writes data.json
│   ├── sources.py        # list of source URLs and metadata
│   └── requirements.txt  # anthropic, requests, beautifulsoup4, geopy
├── docs/
│   └── superpowers/specs/
│       └── 2026-04-24-boston-camp-finder-design.md
├── index.html            # single-page website
├── data.json             # scraper output, committed to repo
└── .github/
    └── workflows/
        └── scrape.yml    # weekly cron + manual trigger
```

GitHub Pages serves `index.html` directly from the repo. No build step, no server.

## Data Sources (16 total)

| # | Organization | Notes |
|---|---|---|
| 1 | Boston Nature Center | |
| 2 | YMCA Greater Boston | |
| 3 | Girl Scouts of Eastern MA | |
| 4 | Create Art (JP & Roslindale) | |
| 5 | Franklin Park Zoo | |
| 6 | Broderick's Gymnastics | |
| 7 | Viking Sports | |
| 8 | Commonwealth Circus School | |
| 9 | Boston Centers for Youth & Families (BCYF) | City program, multiple neighborhoods |
| 10 | Camp Harbor View | Free camp for Boston kids |
| 11 | New England Aquarium | |
| 12 | Museum of Science | STEM-focused |
| 13 | JCC Greater Boston | Newton-based, popular with Boston families |
| 14 | Zumix | Music-focused, East Boston |
| 15 | Tenacity | Tennis + academic, city-wide |
| 16 | Berklee City Music | Music camps |

Adding a new source in the future requires one line in `sources.py`.

## Data Model

Each scraped camp record:

```json
{
  "camp_name": "Zoo Crew Summer Camp",
  "organization": "Franklin Park Zoo",
  "website_url": "https://franklinparkzoo.org/camps",
  "address": "1 Franklin Park Rd, Boston, MA 02121",
  "neighborhood": "Dorchester",
  "distance_from_roslindale_miles": 2.4,
  "age_range": "5–12 years",
  "camp_type": "Nature",
  "hours_of_day": "Full day (9am–4pm)",
  "weeks_available": "June 23 – August 15, weekly sessions",
  "cost_per_week": "$350",
  "financial_aid_available": true,
  "signup_url": "https://franklinparkzoo.org/camps/register",
  "signup_opens": "March 1, 2026",
  "data_year": 2026,
  "data_is_stale": false,
  "last_scraped": "2026-04-20T11:00:00Z"
}
```

`distance_from_roslindale_miles` is calculated from the address using geopy (or a hardcoded neighborhood centroid lookup as fallback).

## Scraper Design (`scraper/scraper.py`)

For each source in `sources.py`, the scraper runs a multi-hop extraction loop:

1. Fetch the starting URL (HTML)
2. Strip to readable text, send to Claude with extraction prompt
3. Claude returns: structured JSON for any camps found + list of follow-up URLs likely to contain more camp details
4. If fields are missing and follow-up URLs exist and hop count < 3, fetch those URLs and repeat from step 2
5. Stop when Claude indicates sufficient data or max depth (3) is reached
6. Add `last_scraped` timestamp and calculate `distance_from_roslindale_miles`
7. Append results to output list

After all sources are processed, write the full list to `data.json`.

**Claude prompt approach:** Each call asks Claude to extract all available fields and identify relevant follow-up links. Claude sets `data_is_stale: true` and uses the prior `data_year` when information appears to be from a previous year.

**Cost estimate:** ~9 Claude API calls per source (worst case, 3 hops × some sources), 16 sources, weekly = well under $1/week at current API pricing.

**`ANTHROPIC_API_KEY`** is stored as a GitHub Actions secret. Never committed to the repo.

## GitHub Actions Workflow (`.github/workflows/scrape.yml`)

```yaml
on:
  schedule:
    - cron: '0 11 * * 0'  # Sundays 6am ET
  workflow_dispatch:        # manual trigger from GitHub UI
```

Steps:
1. Checkout repo
2. Set up Python
3. Install dependencies
4. Run `scraper.py`
5. If `data.json` changed, commit and push back to repo

GitHub Pages then serves the updated `index.html` automatically.

## Website (`index.html`)

Single static HTML page. No framework, no build step.

**Table columns:**
Camp Name | Organization | Type | Neighborhood | Distance from Roslindale | Age Range | Hours | Weeks Available | Cost/Week | Signup Opens | Financial Aid | Website | Data Year

**Filters above table:**
- Camp Type (dropdown)
- Max Distance from Roslindale (dropdown: 2mi / 5mi / 7mi / Any)
- Age Range (text or dropdown)
- Text search (searches camp name and organization)

**Stale data indicator:** Rows where `data_is_stale: true` show a yellow "Prior Year" badge in the Data Year column with a tooltip: "This information is from [year]. Verify with the camp directly."

**Footer note:** "Information is scraped weekly and may be out of date. Always confirm details directly with the camp."

## GitHub Repository Setup

- Repo: `boston-camp-finder` (public, on timothyhall's GitHub account)
- GitHub Pages: enabled on `main` branch, serving from root
- Secret: `ANTHROPIC_API_KEY` configured in repo settings
- Friend is added as a collaborator

## Future Migration Path (AWS)

When ready to migrate to AWS:
- `scraper.py` → AWS Lambda function (minimal changes)
- GitHub Actions cron → AWS EventBridge rule
- `data.json` → DynamoDB table (one item per camp record)
- `index.html` → S3 static website or CloudFront
- Infrastructure defined in Terraform

The scraper's structure is intentionally Lambda-compatible: stateless, reads from environment variables, writes JSON output.
