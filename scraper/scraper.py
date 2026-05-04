import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union
from urllib.parse import urldefrag, urljoin, urlparse

import anthropic

from scraper.extractor import extract_camps
from scraper.fetcher import fetch_page
from scraper.geocoder import distance_from_roslindale
from scraper.sources import SOURCES
from scraper.suggest_resolver import mark_suggestion_scraped, resolve_suggestions

MAX_HOPS = 5
DEFAULT_MAX_PAGES = MAX_HOPS
DEFAULT_INCLUDE_PATTERNS = [
    "camp",
    "summer",
    "youth",
    "kids",
    "registration",
    "register",
    "program",
    "school-break",
    "day-camp",
    "recreation",
]
DEFAULT_EXCLUDE_PATTERNS = [
    "career",
    "staff",
    "donate",
    "privacy",
    "news",
    "event",
    "press",
    "blog",
]
QUALITY_FIELDS = [
    "address",
    "neighborhood",
    "age_range",
    "hours_of_day",
    "cost_per_week",
    "signup_url",
]
DEFAULT_MAX_DISTANCE_MILES = 25
OUT_OF_SCOPE_LOCATION_PATTERNS = [
    "los angeles",
    "stone zoo",
    "manchester",
    "topsfield",
    "chelmsford",
    "t l storer",
    "t.l. storer",
    "pleasant valley",
    "north woods",
    "sandy island",
]
MANUAL_CAMPS_PATH = Path(__file__).with_name("manual_camps.json")


SourceConfig = Union[dict, str]


def _source_url(source: SourceConfig) -> str:
    if isinstance(source, dict):
        return source["url"]
    return source


def _patterns(source: SourceConfig, key: str, defaults: list[str]) -> list[str]:
    if not isinstance(source, dict):
        return defaults
    return source.get(key, defaults)


def _normalized_text(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _url_text(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.path} {parsed.query}".lower()


def _matches_any(value: str, patterns: list[str]) -> bool:
    return any(pattern.lower() in value for pattern in patterns)


def follow_url_score(source: SourceConfig, resolved_url: str) -> int:
    url_text = _url_text(resolved_url)
    include_patterns = _patterns(source, "include_patterns", DEFAULT_INCLUDE_PATTERNS)
    return sum(1 for pattern in include_patterns if pattern.lower() in url_text)


def safe_follow_url(source: SourceConfig, current_url: str, follow_url: str) -> Optional[str]:
    resolved = urljoin(current_url, follow_url)
    resolved, _ = urldefrag(resolved)
    source_url = _source_url(source)
    source_parsed = urlparse(source_url)
    candidate = urlparse(resolved)

    if candidate.scheme not in ("http", "https"):
        return None

    candidate_netloc = candidate.netloc.lower()
    allowed_external_domains = []
    if isinstance(source, dict):
        allowed_external_domains = [
            domain.lower()
            for domain in source.get("allow_external_registration_domains", [])
        ]

    if candidate_netloc != source_parsed.netloc.lower() and candidate_netloc not in allowed_external_domains:
        return None

    url_text = _url_text(resolved)
    include_patterns = _patterns(source, "include_patterns", DEFAULT_INCLUDE_PATTERNS)
    exclude_patterns = _patterns(source, "exclude_patterns", DEFAULT_EXCLUDE_PATTERNS)
    if _matches_any(url_text, exclude_patterns) and not _matches_any(url_text, include_patterns):
        return None

    return resolved


def _follow_candidates(source: dict, current_url: str, follow_urls: list[str], *, require_score: bool) -> list[str]:
    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()

    for follow_url in follow_urls:
        safe_url = safe_follow_url(source, current_url, follow_url)
        if not safe_url or safe_url in seen:
            continue
        score = follow_url_score(source, safe_url)
        if require_score and score <= 0:
            continue
        candidates.append((score, safe_url))
        seen.add(safe_url)

    candidates.sort(key=lambda item: (-item[0], item[1]))
    return [url for _, url in candidates]


def scrape_source(source: dict, client: anthropic.Anthropic) -> list[dict]:
    visited: set[str] = set()
    queue: list[str] = [source["url"]]
    all_camps: list[dict] = []
    hop = 0
    max_pages = int(source.get("max_pages", DEFAULT_MAX_PAGES))

    while queue and hop < max_pages and hop < MAX_HOPS:
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
                camp.get("address"), camp.get("neighborhood"), camp.get("organization")
            )
            all_camps.append(camp)

        follow_candidates = _follow_candidates(
            source,
            url,
            result.get("follow_up_urls", []),
            require_score=bool(result.get("has_sufficient_data")),
        )
        for safe_url in follow_candidates:
            if safe_url not in visited and safe_url not in queue:
                queue.append(safe_url)

        if result.get("has_sufficient_data") and not follow_candidates:
            break

        hop += 1
        time.sleep(1)

    return all_camps


def _camp_key(camp: dict) -> tuple[str, str]:
    return (
        _normalized_text(camp.get("organization")),
        _normalized_text(camp.get("camp_name")),
    )


def _record_score(camp: dict) -> int:
    return sum(1 for value in camp.values() if value not in (None, "", [], {}))


def dedupe_camps(camps: list[dict]) -> list[dict]:
    best_by_key: dict[tuple[str, str], dict] = {}

    for camp in camps:
        key = _camp_key(camp)
        existing = best_by_key.get(key)
        if existing is None or _record_score(camp) > _record_score(existing):
            best_by_key[key] = camp

    return list(best_by_key.values())


def filter_in_scope_camps(camps: list[dict], max_distance_miles: float = DEFAULT_MAX_DISTANCE_MILES) -> list[dict]:
    in_scope: list[dict] = []
    for camp in camps:
        distance = camp.get("distance_from_roslindale_miles")
        if isinstance(distance, (int, float)) and distance > max_distance_miles:
            continue
        if _camp_has_out_of_scope_location(camp):
            continue
        in_scope.append(camp)
    return in_scope


def _camp_has_out_of_scope_location(camp: dict) -> bool:
    searchable = " ".join(
        _normalized_text(camp.get(field))
        for field in ("camp_name", "organization", "address", "neighborhood", "website_url")
    )
    return any(pattern in searchable for pattern in OUT_OF_SCOPE_LOCATION_PATTERNS)


def build_quality_summary(camps: list[dict]) -> dict:
    unique_keys = {_camp_key(camp) for camp in camps}
    missing_fields = {
        field: sum(1 for camp in camps if camp.get(field) in (None, "", []))
        for field in QUALITY_FIELDS
    }
    out_of_scope_rows = sum(
        1
        for camp in camps
        if (
            isinstance(camp.get("distance_from_roslindale_miles"), (int, float))
            and camp["distance_from_roslindale_miles"] > DEFAULT_MAX_DISTANCE_MILES
        )
        or _camp_has_out_of_scope_location(camp)
    )

    return {
        "total_rows": len(camps),
        "duplicate_rows": len(camps) - len(unique_keys),
        "missing_fields": missing_fields,
        "out_of_scope_rows": out_of_scope_rows,
    }


def print_quality_summary(summary: dict, label: str = "Data quality summary") -> None:
    print(f"\n{label}:")
    print(f"  total rows: {summary['total_rows']}")
    print(f"  duplicate rows: {summary['duplicate_rows']}")
    print(f"  out-of-scope rows: {summary['out_of_scope_rows']}")
    print("  missing fields:")
    for field, count in summary["missing_fields"].items():
        print(f"    {field}: {count}")


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

    suggested_sources = resolve_suggestions(client)

    for source in SOURCES:
        print(f"Scraping {source['name']}...")
        camps = scrape_source(source, client)
        print(f"  -> {len(camps)} camp(s) found")
        all_camps.extend(camps)
        time.sleep(2)

    for suggestion in suggested_sources:
        source = {"name": suggestion["name"], "url": suggestion["url"]}
        print(f"Scraping suggested camp: {suggestion['name']}...")
        camps = scrape_source(source, client)
        print(f"  -> {len(camps)} camp(s) found")
        all_camps.extend(camps)
        mark_suggestion_scraped(suggestion["submission_id"], found=len(camps) > 0)
        time.sleep(2)

    if not all_camps:
        print("\n[abort] Web scraping returned 0 camps — API or network issue likely. Not overwriting data.json.")
        raise SystemExit(1)

    manual_camps = load_manual_camps()
    if manual_camps:
        all_camps = merge_manual_camps(all_camps, manual_camps)
        print(f"  -> merged {len(manual_camps)} manual camp(s)")

    pre_cleanup_summary = build_quality_summary(all_camps)
    all_camps = filter_in_scope_camps(all_camps)
    all_camps = dedupe_camps(all_camps)
    post_cleanup_summary = build_quality_summary(all_camps)
    print_quality_summary(pre_cleanup_summary, "Data quality summary before cleanup")
    print_quality_summary(post_cleanup_summary, "Data quality summary after cleanup")

    with open(output_path, "w") as f:
        json.dump(all_camps, f, indent=2)

    history_dir = Path(output_path).parent / "history"
    history_dir.mkdir(exist_ok=True)
    history_path = history_dir / f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
    with open(history_path, "w") as f:
        json.dump(all_camps, f, indent=2)

    print(f"\nDone. Wrote {len(all_camps)} total camps to {output_path} and {history_path}")


def run_single(url: str, name: str) -> None:
    client = anthropic.Anthropic()
    source = {"name": name, "url": url}
    print(f"Scraping {name} ({url})...")
    camps = scrape_source(source, client)
    print(f"  -> {len(camps)} camp(s) found")
    for c in camps:
        print(f"     - {c.get('camp_name')} | {c.get('weeks_available')} | {c.get('cost_per_week')}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="Scrape a single URL instead of all sources")
    parser.add_argument("--name", default="Test", help="Name to use with --url")
    args = parser.parse_args()

    if args.url:
        run_single(args.url, args.name)
    else:
        run_scraper()
