# Boston Camp Finder

Weekly-updated aggregator of kids' camps near Roslindale, MA.

**Live site:** https://timothyryanhall.github.io/boston-camp-finder/

Data is scraped every Sunday from 16 Boston-area organizations using Claude for extraction.
To add a new source, add one entry to `scraper/sources.py`.

## Setup

1. Fork or clone the repo
2. Add your `ANTHROPIC_API_KEY` as a GitHub Actions secret (Settings → Secrets → Actions)
3. Enable GitHub Pages (Settings → Pages → Source: Deploy from branch → main → / (root))
4. Trigger the first scrape manually: Actions → Scrape Camp Data → Run workflow
