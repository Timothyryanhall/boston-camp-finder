import json
import os
from unittest.mock import MagicMock, patch
from scraper.scraper import (
    MAX_HOPS,
    build_quality_summary,
    dedupe_camps,
    filter_in_scope_camps,
    load_manual_camps,
    merge_manual_camps,
    safe_follow_url,
    scrape_source,
    run_scraper,
)


def _make_client() -> MagicMock:
    return MagicMock()


def _extractor_result(camps=None, follow_ups=None, sufficient=True):
    return {
        "camps": camps or [],
        "follow_up_urls": follow_ups or [],
        "has_sufficient_data": sufficient,
    }


def test_scrape_source_stops_when_sufficient_data():
    source = {"name": "Test Org", "url": "https://example.com"}
    camp = {"camp_name": "Test Camp", "organization": "Test Org", "address": None, "neighborhood": None}

    with patch("scraper.scraper.fetch_page", return_value="page content"), \
         patch("scraper.scraper.extract_camps", return_value=_extractor_result(camps=[camp], sufficient=True)):
        result = scrape_source(source, _make_client())

    assert len(result) == 1
    assert result[0]["camp_name"] == "Test Camp"


def test_scrape_source_continues_to_high_value_follow_ups_after_sufficient_data():
    source = {"name": "Test Org", "url": "https://example.com/camps", "max_pages": 3}
    landing_camp = {"camp_name": "Landing Camp", "organization": "Test Org", "address": None, "neighborhood": None}
    detail_camp = {"camp_name": "Detail Camp", "organization": "Test Org", "address": None, "neighborhood": None}

    seen_urls: list[str] = []

    def fake_extract(client, url, org, content):
        seen_urls.append(url)
        if url == "https://example.com/camps/details":
            return _extractor_result(camps=[detail_camp], sufficient=True)
        return _extractor_result(
            camps=[landing_camp],
            follow_ups=["/camps/details", "/about-us"],
            sufficient=True,
        )

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        result = scrape_source(source, _make_client())

    assert seen_urls == ["https://example.com/camps", "https://example.com/camps/details"]
    assert [camp["camp_name"] for camp in result] == ["Landing Camp", "Detail Camp"]


def test_scrape_source_follows_links_when_insufficient():
    source = {"name": "Test Org", "url": "https://example.com"}
    camp = {"camp_name": "Deep Camp", "organization": "Test Org", "address": None, "neighborhood": None}

    call_count = 0
    def fake_extract(client, url, org, content):
        nonlocal call_count
        call_count += 1
        if url == "https://example.com/details":
            return _extractor_result(camps=[camp], sufficient=True)
        return _extractor_result(follow_ups=["https://example.com/details"], sufficient=False)

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        result = scrape_source(source, _make_client())

    assert call_count == 2
    assert len(result) == 1


def test_scrape_source_respects_max_depth():
    source = {"name": "Test Org", "url": "https://example.com"}

    hop = 0
    def fake_extract(client, url, org, content):
        nonlocal hop
        hop += 1
        return _extractor_result(
            follow_ups=[f"https://example.com/page{hop}"],
            sufficient=False,
        )

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        result = scrape_source(source, _make_client())

    assert hop == MAX_HOPS


def test_scrape_source_respects_source_max_pages():
    source = {"name": "Test Org", "url": "https://example.com", "max_pages": 2}

    fetched_urls: list[str] = []

    def fake_extract(client, url, org, content):
        fetched_urls.append(url)
        return _extractor_result(
            follow_ups=[f"https://example.com/camp-page-{len(fetched_urls)}"],
            sufficient=False,
        )

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        scrape_source(source, _make_client())

    assert len(fetched_urls) == 2


def test_safe_follow_url_allows_same_origin_links():
    source_url = "https://example.com/camps"
    current_url = "https://example.com/camps/summer"

    assert safe_follow_url(source_url, current_url, "/register#top") == "https://example.com/register"


def test_safe_follow_url_rejects_excluded_paths_even_when_same_origin():
    source_url = "https://example.com/camps"
    current_url = "https://example.com/camps/summer"

    assert safe_follow_url(source_url, current_url, "/careers") is None
    assert safe_follow_url(source_url, current_url, "/news/fall-gala") is None


def test_safe_follow_url_allows_configured_external_registration_domains():
    source_url = "https://example.com/camps"
    current_url = "https://example.com/camps/summer"
    source = {
        "url": source_url,
        "allow_external_registration_domains": ["register.example.org"],
    }

    assert (
        safe_follow_url(source, current_url, "https://register.example.org/programs/summer-camp")
        == "https://register.example.org/programs/summer-camp"
    )


def test_safe_follow_url_rejects_cross_origin_and_non_http_links():
    source_url = "https://example.com/camps"
    current_url = "https://example.com/camps/summer"

    assert safe_follow_url(source_url, current_url, "https://attacker.test/collect") is None
    assert safe_follow_url(source_url, current_url, "javascript:alert(1)") is None


def test_scrape_source_skips_cross_origin_follow_up_urls():
    source = {"name": "Test Org", "url": "https://example.com"}

    call_count = 0
    def fake_extract(client, url, org, content):
        nonlocal call_count
        call_count += 1
        return _extractor_result(
            follow_ups=["https://attacker.test/collect"],
            sufficient=False,
        )

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        scrape_source(source, _make_client())

    assert call_count == 1


def test_scrape_source_skips_visited_urls():
    source = {"name": "Test Org", "url": "https://example.com"}

    call_count = 0
    def fake_extract(client, url, org, content):
        nonlocal call_count
        call_count += 1
        return _extractor_result(
            follow_ups=["https://example.com"],  # same as starting URL
            sufficient=False,
        )

    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", side_effect=fake_extract):
        scrape_source(source, _make_client())

    assert call_count == 1


def test_scrape_source_adds_last_scraped_and_distance():
    source = {"name": "Test Org", "url": "https://example.com"}
    camp = {
        "camp_name": "Test Camp",
        "organization": "Test Org",
        "address": None,
        "neighborhood": "Jamaica Plain",
    }
    with patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", return_value=_extractor_result(camps=[camp], sufficient=True)):
        result = scrape_source(source, _make_client())

    assert "last_scraped" in result[0]
    assert result[0]["distance_from_roslindale_miles"] is not None


def test_run_scraper_writes_data_json(tmp_path):
    output = tmp_path / "data.json"
    sources = [{"name": "Org A", "url": "https://a.com"}]
    camp = {"camp_name": "Camp A", "organization": "Org A", "address": None, "neighborhood": None}

    with patch("scraper.scraper.SOURCES", sources), \
         patch("scraper.scraper.fetch_page", return_value="content"), \
         patch("scraper.scraper.extract_camps", return_value=_extractor_result(camps=[camp], sufficient=True)), \
         patch("scraper.scraper.load_manual_camps", return_value=[]):
        run_scraper(output_path=str(output))

    data = json.loads(output.read_text())
    assert len(data) == 1
    assert data[0]["camp_name"] == "Camp A"


def test_load_manual_camps_reads_json_list(tmp_path):
    manual_path = tmp_path / "manual_camps.json"
    manual_path.write_text(json.dumps([{"camp_name": "Manual Camp", "organization": "Org"}]))

    assert load_manual_camps(manual_path) == [{"camp_name": "Manual Camp", "organization": "Org"}]


def test_merge_manual_camps_adds_new_records_and_skips_duplicates():
    scraped = [{"camp_name": "Camp A", "organization": "Org"}]
    manual = [
        {"camp_name": "Camp A", "organization": "Org"},
        {"camp_name": "Manual Camp", "organization": "Manual Org"},
    ]

    merged = merge_manual_camps(scraped, manual)

    assert merged == [
        {"camp_name": "Camp A", "organization": "Org"},
        {"camp_name": "Manual Camp", "organization": "Manual Org"},
    ]


def test_dedupe_camps_normalizes_names_and_prefers_more_complete_record():
    sparse = {
        "camp_name": "Y Day Camp",
        "organization": "YMCA Greater Boston",
        "website_url": "https://ymcaboston.org/day-camps",
        "address": None,
    }
    complete = {
        "camp_name": "Y Day Camp",
        "organization": "YMCA Greater Boston",
        "website_url": "https://ymcaboston.org/day-camps/",
        "address": "316 Huntington Ave, Boston, MA",
    }

    assert dedupe_camps([sparse, complete]) == [complete]


def test_filter_in_scope_camps_removes_remote_rows_with_known_distance():
    nearby = {"camp_name": "Nearby", "distance_from_roslindale_miles": 4.5}
    remote = {"camp_name": "Remote", "distance_from_roslindale_miles": 48}
    unknown = {"camp_name": "Unknown", "distance_from_roslindale_miles": None}

    assert filter_in_scope_camps([nearby, remote, unknown], max_distance_miles=25) == [nearby, unknown]


def test_filter_in_scope_camps_removes_known_out_of_scope_location_text():
    nearby = {"camp_name": "ZooCamp at Franklin Park Zoo", "distance_from_roslindale_miles": None}
    remote = {"camp_name": "ZooCamp at Stone Zoo - Cryptic Critters", "distance_from_roslindale_miles": None}

    assert filter_in_scope_camps([nearby, remote]) == [nearby]


def test_build_quality_summary_counts_duplicates_and_missing_fields():
    camps = [
        {"camp_name": "Camp A", "organization": "Org", "address": None, "neighborhood": "JP"},
        {"camp_name": "Camp A", "organization": "Org", "address": "1 Main St", "neighborhood": None},
        {"camp_name": "Camp B", "organization": "Org", "address": "2 Main St", "neighborhood": "Roslindale"},
    ]

    summary = build_quality_summary(camps)

    assert summary["total_rows"] == 3
    assert summary["duplicate_rows"] == 1
    assert summary["missing_fields"]["address"] == 1
    assert summary["missing_fields"]["neighborhood"] == 1
