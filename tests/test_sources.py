from scraper.sources import SOURCES


def test_sources_is_list():
    assert isinstance(SOURCES, list)


def test_sources_not_empty():
    assert len(SOURCES) >= 16


def test_each_source_has_required_fields():
    for source in SOURCES:
        assert "name" in source, f"Missing 'name' in {source}"
        assert "url" in source, f"Missing 'url' in {source}"
        assert source["name"], f"Empty name in {source}"
        assert source["url"].startswith("http"), f"Bad URL in {source}"


def test_no_duplicate_names():
    names = [s["name"] for s in SOURCES]
    assert len(names) == len(set(names)), "Duplicate source names found"


def test_high_priority_issue_20_sources_are_configured():
    source_names = {source["name"] for source in SOURCES}

    assert {
        "Boston Ballet School",
        "Boston College Eagles Rec Camp",
        "Camp Shriver",
        "Boston Parks and Recreation",
        "Brookline Recreation",
        "Newton Parks and Recreation",
        "Creative Arts at Park",
        "Dedham Country Day Camp",
    }.issubset(source_names)


def test_each_source_max_pages_is_positive_when_configured():
    for source in SOURCES:
        if "max_pages" in source:
            assert isinstance(source["max_pages"], int)
            assert source["max_pages"] > 0


def test_source_patterns_are_lists_when_configured():
    for source in SOURCES:
        for key in ("include_patterns", "exclude_patterns", "allow_external_registration_domains"):
            if key in source:
                assert isinstance(source[key], list), f"{key} must be a list in {source['name']}"
