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
