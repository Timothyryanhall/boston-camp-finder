import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urldefrag, urljoin, urlparse

import anthropic

from scraper.extractor import extract_camps
from scraper.fetcher import fetch_page
from scraper.geocoder import distance_from_roslindale
from scraper.sources import SOURCES

MAX_HOPS = 5
MANUAL_CAMPS_PATH = Path(__file__).with_name("manual_camps.json")


def safe_follow_url(source_url: str, current_url: str, follow_url: str) -> Optional[str]:
    resolved = urljoin(current_url, follow_url)
    resolved, _ = urldefrag(resolved)
    source = urlparse(source_url)
    candidate = urlparse(resolved)

    if candidate.scheme not in ("http", "https"):
        return None
    if candidate.netloc.lower() != source.netloc.lower():
        return None
    return resolved


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

        print(f"  [fetched] {url} ({len(content)} chars)")
        result = extract_camps(client, url, source["name"], content)
        print(f"  [claude] camps={len(result.get('camps', []))}, sufficient={result.get('has_sufficient_data')}, follow_ups={result.get('follow_up_urls', [])}")

        for camp in result.get("camps", []):
            camp["last_scraped"] = datetime.now(timezone.utc).isoformat()
            camp["distance_from_roslindale_miles"] = distance_from_roslindale(
                camp.get("address"), camp.get("neighborhood")
            )
            all_camps.append(camp)

        if result.get("has_sufficient_data"):
            break

        for follow_url in result.get("follow_up_urls", []):
            safe_url = safe_follow_url(source["url"], url, follow_url)
            if safe_url and safe_url not in visited:
                queue.append(safe_url)

        hop += 1
        time.sleep(1)

    return all_camps


def _camp_key(camp: dict) -> tuple[str, str]:
    return (
        str(camp.get("organization") or "").strip().lower(),
        str(camp.get("camp_name") or "").strip().lower(),
    )


def load_manual_camps(path: Path = MANUAL_CAMPS_PATH) -> list[dict]:
    if not path.exists():
        return []

    with path.open() as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a list of camp records")

    return data


def merge_manual_camps(scraped_camps: list[dict], manual_camps: list[dict]) -> list[dict]:
    merged = list(scraped_camps)
    seen = {_camp_key(camp) for camp in merged}

    for camp in manual_camps:
        key = _camp_key(camp)
        if key in seen:
            continue
        merged.append(camp)
        seen.add(key)

    return merged


def run_scraper(output_path: str = "data.json") -> None:
    client = anthropic.Anthropic()
    all_camps: list[dict] = []

    for source in SOURCES:
        print(f"Scraping {source['name']}...")
        camps = scrape_source(source, client)
        print(f"  -> {len(camps)} camp(s) found")
        all_camps.extend(camps)
        time.sleep(2)

    if not all_camps:
        print("\n[abort] Web scraping returned 0 camps — API or network issue likely. Not overwriting data.json.")
        raise SystemExit(1)

    manual_camps = load_manual_camps()
    if manual_camps:
        all_camps = merge_manual_camps(all_camps, manual_camps)
        print(f"  -> merged {len(manual_camps)} manual camp(s)")

    with open(output_path, "w") as f:
        json.dump(all_camps, f, indent=2)

    print(f"\nDone. Wrote {len(all_camps)} total camps to {output_path}")


if __name__ == "__main__":
    run_scraper()
