import json
import os
from unittest.mock import MagicMock, patch
from scraper.scraper import MAX_HOPS, safe_follow_url, scrape_source, run_scraper


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


def test_safe_follow_url_allows_same_origin_links():
    source_url = "https://example.com/camps"
    current_url = "https://example.com/camps/summer"

    assert safe_follow_url(source_url, current_url, "/register#top") == "https://example.com/register"


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
         patch("scraper.scraper.extract_camps", return_value=_extractor_result(camps=[camp], sufficient=True)):
        run_scraper(output_path=str(output))

    data = json.loads(output.read_text())
    assert len(data) == 1
    assert data[0]["camp_name"] == "Camp A"
