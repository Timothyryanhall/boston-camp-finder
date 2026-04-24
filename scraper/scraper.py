import json
import time
from datetime import datetime, timezone

import anthropic

from scraper.extractor import extract_camps
from scraper.fetcher import fetch_page
from scraper.geocoder import distance_from_roslindale
from scraper.sources import SOURCES

MAX_HOPS = 3


def scrape_source(source: dict, client: anthropic.Anthropic) -> list[dict]:
    visited: set[str] = set()
    queue: list[str] = [source["url"]]
    all_camps: list[dict] = []
    hop = 0

    while queue and hop < MAX_HOPS:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            content = fetch_page(url)
        except Exception as e:
            print(f"  [skip] {url}: {e}")
            hop += 1
            continue

        result = extract_camps(client, url, source["name"], content)

        for camp in result.get("camps", []):
            camp["last_scraped"] = datetime.now(timezone.utc).isoformat()
            camp["distance_from_roslindale_miles"] = distance_from_roslindale(
                camp.get("address"), camp.get("neighborhood")
            )
            all_camps.append(camp)

        if result.get("has_sufficient_data"):
            break

        for follow_url in result.get("follow_up_urls", []):
            if follow_url not in visited:
                queue.append(follow_url)

        hop += 1
        time.sleep(1)

    return all_camps


def run_scraper(output_path: str = "data.json") -> None:
    client = anthropic.Anthropic()
    all_camps: list[dict] = []

    for source in SOURCES:
        print(f"Scraping {source['name']}...")
        camps = scrape_source(source, client)
        print(f"  -> {len(camps)} camp(s) found")
        all_camps.extend(camps)
        time.sleep(2)

    with open(output_path, "w") as f:
        json.dump(all_camps, f, indent=2)

    print(f"\nDone. Wrote {len(all_camps)} total camps to {output_path}")


if __name__ == "__main__":
    run_scraper()
