import json
from unittest.mock import MagicMock, patch
from scraper.extractor import extract_camps, EXTRACTION_PROMPT


def _make_client(response_text: str) -> MagicMock:
    client = MagicMock()
    message = MagicMock()
    message.content = [MagicMock(text=response_text)]
    client.messages.create.return_value = message
    return client


def test_extract_camps_returns_camps_list():
    payload = {
        "camps": [
            {
                "camp_name": "Zoo Crew Camp",
                "organization": "Franklin Park Zoo",
                "website_url": "https://zoonewengland.org/camps",
                "address": "1 Franklin Park Rd, Boston, MA 02121",
                "neighborhood": "Dorchester",
                "age_range": "5-12 years",
                "camp_type": "Nature",
                "hours_of_day": "Full day (9am-4pm)",
                "weeks_available": "June 23 - August 15",
                "cost_per_week": "$350",
                "financial_aid_available": True,
                "signup_url": "https://zoonewengland.org/register",
                "signup_opens": "March 1, 2026",
                "data_year": 2026,
                "data_is_stale": False,
            }
        ],
        "follow_up_urls": [],
        "has_sufficient_data": True,
    }
    client = _make_client(json.dumps(payload))
    result = extract_camps(client, "https://zoonewengland.org/camps", "Franklin Park Zoo", "Camp info here")
    assert len(result["camps"]) == 1
    assert result["camps"][0]["camp_name"] == "Zoo Crew Camp"
    assert result["has_sufficient_data"] is True


def test_extract_camps_returns_follow_up_urls():
    payload = {
        "camps": [],
        "follow_up_urls": ["https://example.com/summer", "https://example.com/spring"],
        "has_sufficient_data": False,
    }
    client = _make_client(json.dumps(payload))
    result = extract_camps(client, "https://example.com", "Test Org", "Some content")
    assert result["follow_up_urls"] == ["https://example.com/summer", "https://example.com/spring"]
    assert result["has_sufficient_data"] is False


def test_extract_camps_handles_invalid_json():
    client = _make_client("not valid json at all")
    result = extract_camps(client, "https://example.com", "Test Org", "content")
    assert result["camps"] == []
    assert result["follow_up_urls"] == []
    assert result["has_sufficient_data"] is False


def test_extract_camps_truncates_long_content():
    long_content = "x" * 30000
    client = _make_client(json.dumps({"camps": [], "follow_up_urls": [], "has_sufficient_data": True}))
    extract_camps(client, "https://example.com", "Test Org", long_content)
    call_args = client.messages.create.call_args
    prompt_text = call_args[1]["messages"][0]["content"]
    assert len(prompt_text) < 25000


def test_extraction_prompt_contains_all_required_fields():
    required = [
        "camp_name", "organization", "website_url", "address", "neighborhood",
        "age_range", "camp_type", "hours_of_day", "weeks_available", "cost_per_week",
        "financial_aid_available", "signup_url", "signup_opens", "data_year", "data_is_stale",
        "follow_up_urls", "has_sufficient_data",
    ]
    for field in required:
        assert field in EXTRACTION_PROMPT, f"Missing field '{field}' in EXTRACTION_PROMPT"
