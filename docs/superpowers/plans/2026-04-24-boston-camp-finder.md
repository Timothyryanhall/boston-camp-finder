# Boston Camp Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a weekly-updated static website that aggregates Boston-area kids' camp data from 16 sources using an AI-powered Python scraper, served via GitHub Pages.

**Architecture:** A Python scraper runs weekly on GitHub Actions, using Claude to extract structured camp data from each source website with up to 3 hops per source. Results are saved as `data.json` and committed back to the repo. A single static `index.html` served via GitHub Pages reads the JSON and renders a filterable table with stale-data indicators.

**Tech Stack:** Python 3.13, Anthropic SDK (claude-sonnet-4-6), requests, BeautifulSoup4, geopy, pytest, GitHub Actions, GitHub Pages

---

## File Map

```
boston-camp-finder/
├── scraper/
│   ├── __init__.py         # empty, makes scraper a package
│   ├── sources.py          # list of 16 source dicts with name + url
│   ├── fetcher.py          # fetch URL → cleaned text
│   ├── geocoder.py         # address/neighborhood → miles from Roslindale
│   ├── extractor.py        # call Claude, return structured camp JSON
│   └── scraper.py          # orchestrator: multi-hop loop, writes data.json
├── tests/
│   ├── __init__.py
│   ├── test_geocoder.py
│   ├── test_fetcher.py
│   ├── test_extractor.py
│   └── test_scraper.py
├── docs/
│   └── superpowers/
│       ├── specs/2026-04-24-boston-camp-finder-design.md
│       └── plans/2026-04-24-boston-camp-finder.md
├── .github/
│   └── workflows/
│       └── scrape.yml
├── index.html
├── data.json               # starts as empty array [], updated weekly by CI
├── requirements.txt
├── pyproject.toml
└── .gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `requirements.txt`
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `data.json`
- Create: `scraper/__init__.py`
- Create: `tests/__init__.py`

- [ ] **Step 1: Create requirements.txt**

```
anthropic>=0.49.0
requests>=2.31.0
beautifulsoup4>=4.12.0
geopy>=2.4.0
pytest>=8.0.0
```

- [ ] **Step 2: Create pyproject.toml**

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 3: Create .gitignore**

```
__pycache__/
*.py[cod]
.env
*.egg-info/
dist/
.venv/
venv/
```

- [ ] **Step 4: Create data.json (empty array)**

```json
[]
```

- [ ] **Step 5: Create empty package init files**

Create `scraper/__init__.py` (empty file) and `tests/__init__.py` (empty file).

- [ ] **Step 6: Install dependencies**

```bash
pip install -r requirements.txt
```

Expected: packages install without errors.

- [ ] **Step 7: Commit**

```bash
git add requirements.txt pyproject.toml .gitignore data.json scraper/__init__.py tests/__init__.py
git commit -m "chore: project scaffolding"
```

---

## Task 2: Geocoder Module

**Files:**
- Create: `scraper/geocoder.py`
- Create: `tests/test_geocoder.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_geocoder.py`:

```python
from scraper.geocoder import distance_from_roslindale, _haversine_miles

def test_haversine_same_point():
    assert _haversine_miles(42.2834, -71.1270, 42.2834, -71.1270) == 0.0

def test_haversine_known_distance():
    # Roslindale to Jamaica Plain centroid is ~2.6 miles
    dist = _haversine_miles(42.2834, -71.1270, 42.3109, -71.1132)
    assert 2.0 < dist < 3.5

def test_distance_by_neighborhood():
    dist = distance_from_roslindale(address=None, neighborhood="Jamaica Plain")
    assert dist is not None
    assert 2.0 < dist < 3.5

def test_distance_by_neighborhood_case_insensitive():
    dist = distance_from_roslindale(address=None, neighborhood="jamaica plain")
    assert dist is not None

def test_distance_roslindale_to_itself():
    dist = distance_from_roslindale(address=None, neighborhood="Roslindale")
    assert dist == 0.0

def test_distance_returns_none_when_no_info():
    dist = distance_from_roslindale(address=None, neighborhood=None)
    assert dist is None

def test_distance_unknown_neighborhood_returns_none():
    dist = distance_from_roslindale(address=None, neighborhood="Atlantis")
    assert dist is None
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_geocoder.py -v
```

Expected: `ModuleNotFoundError` or `ImportError` — `scraper.geocoder` does not exist yet.

- [ ] **Step 3: Implement scraper/geocoder.py**

```python
import math
from typing import Optional

ROSLINDALE_CENTROID = (42.2834, -71.1270)

NEIGHBORHOOD_CENTROIDS: dict[str, tuple[float, float]] = {
    "roslindale": (42.2834, -71.1270),
    "jamaica plain": (42.3109, -71.1132),
    "jp": (42.3109, -71.1132),
    "dorchester": (42.2986, -71.0638),
    "roxbury": (42.3151, -71.0859),
    "south boston": (42.3354, -71.0487),
    "southie": (42.3354, -71.0487),
    "east boston": (42.3721, -71.0220),
    "charlestown": (42.3780, -71.0603),
    "back bay": (42.3503, -71.0810),
    "fenway": (42.3467, -71.0972),
    "allston": (42.3534, -71.1313),
    "brighton": (42.3468, -71.1564),
    "west roxbury": (42.2806, -71.1582),
    "hyde park": (42.2556, -71.1234),
    "mattapan": (42.2715, -71.0921),
    "mission hill": (42.3269, -71.1027),
    "south end": (42.3407, -71.0734),
    "downtown": (42.3601, -71.0589),
    "beacon hill": (42.3588, -71.0707),
    "north end": (42.3647, -71.0542),
    "newton": (42.3370, -71.2092),
    "brookline": (42.3317, -71.1217),
}


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)), 1)


def _geocode_address(address: str) -> Optional[tuple[float, float]]:
    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="boston-camp-finder/1.0")
        location = geolocator.geocode(address, timeout=5)
        if location:
            return (location.latitude, location.longitude)
    except Exception:
        pass
    return None


def distance_from_roslindale(
    address: Optional[str], neighborhood: Optional[str]
) -> Optional[float]:
    if address:
        coords = _geocode_address(address)
        if coords:
            return _haversine_miles(*ROSLINDALE_CENTROID, *coords)

    if neighborhood:
        key = neighborhood.lower().strip()
        for name, coords in NEIGHBORHOOD_CENTROIDS.items():
            if name in key or key in name:
                return _haversine_miles(*ROSLINDALE_CENTROID, *coords)

    return None
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_geocoder.py -v
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scraper/geocoder.py tests/test_geocoder.py
git commit -m "feat: geocoder module with haversine distance from Roslindale"
```

---

## Task 3: Page Fetcher Module

**Files:**
- Create: `scraper/fetcher.py`
- Create: `tests/test_fetcher.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_fetcher.py`:

```python
from unittest.mock import patch, MagicMock
from scraper.fetcher import fetch_page


def _mock_response(html: str, status: int = 200) -> MagicMock:
    mock = MagicMock()
    mock.status_code = status
    mock.text = html
    mock.raise_for_status = MagicMock()
    return mock


def test_fetch_page_returns_text():
    html = "<html><body><p>Hello world</p></body></html>"
    with patch("scraper.fetcher.requests.get", return_value=_mock_response(html)):
        result = fetch_page("https://example.com")
    assert "Hello world" in result


def test_fetch_page_strips_scripts():
    html = "<html><body><script>alert('x')</script><p>Content</p></body></html>"
    with patch("scraper.fetcher.requests.get", return_value=_mock_response(html)):
        result = fetch_page("https://example.com")
    assert "alert" not in result
    assert "Content" in result


def test_fetch_page_strips_style_tags():
    html = "<html><body><style>body{color:red}</style><p>Text</p></body></html>"
    with patch("scraper.fetcher.requests.get", return_value=_mock_response(html)):
        result = fetch_page("https://example.com")
    assert "color:red" not in result
    assert "Text" in result


def test_fetch_page_raises_on_http_error():
    mock = _mock_response("", 404)
    mock.raise_for_status.side_effect = Exception("404 Not Found")
    with patch("scraper.fetcher.requests.get", return_value=mock):
        try:
            fetch_page("https://example.com/notfound")
            assert False, "Should have raised"
        except Exception as e:
            assert "404" in str(e)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_fetcher.py -v
```

Expected: `ModuleNotFoundError` — `scraper.fetcher` does not exist yet.

- [ ] **Step 3: Implement scraper/fetcher.py**

```python
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; BostonCampFinder/1.0; "
        "+https://github.com/timothyhall/boston-camp-finder)"
    )
}


def fetch_page(url: str, timeout: int = 15) -> str:
    response = requests.get(url, headers=HEADERS, timeout=timeout)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_fetcher.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scraper/fetcher.py tests/test_fetcher.py
git commit -m "feat: page fetcher with HTML stripping"
```

---

## Task 4: Sources List

**Files:**
- Create: `scraper/sources.py`
- Create: `tests/test_sources.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_sources.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_sources.py -v
```

Expected: `ModuleNotFoundError` — `scraper.sources` does not exist yet.

- [ ] **Step 3: Implement scraper/sources.py**

Note: these URLs are best-known starting points. Verify each in a browser before the first scrape run and update any that have changed.

```python
SOURCES: list[dict] = [
    {
        "name": "Boston Nature Center",
        "url": "https://www.massaudubon.org/get-outdoors/wildlife-sanctuaries/boston-nature-center/programs-events/camps",
    },
    {
        "name": "YMCA Greater Boston",
        "url": "https://www.ymcaboston.org/programs/camps",
    },
    {
        "name": "Girl Scouts of Eastern Massachusetts",
        "url": "https://www.gscm.org/en/camp.html",
    },
    {
        "name": "Create Art for All",
        "url": "https://www.createartforall.org/programs/summer-camps/",
    },
    {
        "name": "Franklin Park Zoo",
        "url": "https://www.zoonewengland.org/franklin-park-zoo/education/camps",
    },
    {
        "name": "Broderick's Gymnastics",
        "url": "https://brodericksgym.com/programs/camps/",
    },
    {
        "name": "Viking Sports",
        "url": "https://www.vikingsports.com/programs/camps/",
    },
    {
        "name": "Commonwealth Circus School",
        "url": "https://www.commonwealthcircusschool.com/camps",
    },
    {
        "name": "Boston Centers for Youth & Families",
        "url": "https://www.boston.gov/departments/boston-centers-youth-families/bcyf-summer-camps",
    },
    {
        "name": "Camp Harbor View",
        "url": "https://www.campharborview.org/programs/",
    },
    {
        "name": "New England Aquarium",
        "url": "https://www.neaq.org/education/camp-sea-life/",
    },
    {
        "name": "Museum of Science",
        "url": "https://www.mos.org/camps",
    },
    {
        "name": "JCC Greater Boston",
        "url": "https://www.jccgb.org/camps",
    },
    {
        "name": "Zumix",
        "url": "https://www.zumix.org/programs/camps/",
    },
    {
        "name": "Tenacity",
        "url": "https://tenacity.org/programs/",
    },
    {
        "name": "Berklee City Music",
        "url": "https://www.berklee.edu/city-music/programs",
    },
]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_sources.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scraper/sources.py tests/test_sources.py
git commit -m "feat: initial list of 16 Boston camp sources"
```

---

## Task 5: Claude Extractor Module

**Files:**
- Create: `scraper/extractor.py`
- Create: `tests/test_extractor.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_extractor.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_extractor.py -v
```

Expected: `ModuleNotFoundError` — `scraper.extractor` does not exist yet.

- [ ] **Step 3: Implement scraper/extractor.py**

```python
import json
from datetime import date
from typing import Any

import anthropic

EXTRACTION_PROMPT = """\
You are extracting summer/spring/fall camp program information from a website page.

Given the following text content from {url}, extract all camp programs listed.

Return a JSON object with exactly these top-level keys:

{{
  "camps": [
    {{
      "camp_name": "string - name of the specific camp program",
      "organization": "{organization}",
      "website_url": "string - URL of the camp page or registration page",
      "address": "string or null - street address if listed",
      "neighborhood": "string or null - Boston neighborhood name",
      "age_range": "string or null - e.g. '6-12 years', 'grades 1-6'",
      "camp_type": "string - one of: Nature, Arts, Sports, STEM, Music, Circus, General",
      "hours_of_day": "string or null - e.g. 'Full day (9am-4pm)', 'Morning only (9am-12pm)'",
      "weeks_available": "string or null - date range and session info",
      "cost_per_week": "string or null - e.g. '$350/week', 'Free'",
      "financial_aid_available": "boolean or null",
      "signup_url": "string or null - direct link to registration form",
      "signup_opens": "string or null - date signups open",
      "data_year": "integer - the year this information applies to",
      "data_is_stale": "boolean - true if info appears to be from a year prior to {current_year}"
    }}
  ],
  "follow_up_urls": ["up to 3 URLs on this page that likely lead to more camp details"],
  "has_sufficient_data": "boolean - true if camps array has useful, reasonably complete information"
}}

Current year is {current_year}. If schedules or registration dates appear to be from {prior_year} or earlier, set data_is_stale to true and data_year to that year.

Return only valid JSON. No markdown fences, no explanation, no text before or after the JSON.

Page content:
{content}"""

_EMPTY_RESULT: dict[str, Any] = {
    "camps": [],
    "follow_up_urls": [],
    "has_sufficient_data": False,
}


def extract_camps(
    client: anthropic.Anthropic,
    url: str,
    organization: str,
    content: str,
) -> dict[str, Any]:
    current_year = date.today().year
    prompt = EXTRACTION_PROMPT.format(
        url=url,
        organization=organization,
        current_year=current_year,
        prior_year=current_year - 1,
        content=content[:20000],
    )
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        return json.loads(text)
    except Exception:
        return dict(_EMPTY_RESULT)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_extractor.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scraper/extractor.py tests/test_extractor.py
git commit -m "feat: Claude extractor module with multi-field prompt"
```

---

## Task 6: Scraper Orchestrator

**Files:**
- Create: `scraper/scraper.py`
- Create: `tests/test_scraper.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_scraper.py`:

```python
import json
import os
from unittest.mock import MagicMock, patch
from scraper.scraper import scrape_source, run_scraper


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

    assert hop == 3


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


def test_scrape_source_adds_last_scraped_and_distance(tmp_path):
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_scraper.py -v
```

Expected: `ModuleNotFoundError` — `scraper.scraper` does not exist yet.

- [ ] **Step 3: Implement scraper/scraper.py**

```python
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
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
pytest tests/ -v
```

Expected: all tests PASS (geocoder, fetcher, sources, extractor, scraper).

- [ ] **Step 5: Commit**

```bash
git add scraper/scraper.py tests/test_scraper.py
git commit -m "feat: multi-hop scraper orchestrator with 3-hop max depth"
```

---

## Task 7: Static Website

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Boston Camp Finder</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1400px; margin: 0 auto; padding: 1rem; color: #222; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .subtitle { color: #555; margin-bottom: 1.25rem; font-size: 0.95rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
    .filters label { font-size: 0.85rem; color: #444; }
    .filters select, .filters input { padding: 0.35rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f0f0f0; text-align: left; padding: 0.5rem 0.6rem; border-bottom: 2px solid #ccc; white-space: nowrap; }
    td { padding: 0.45rem 0.6rem; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
    tr:hover td { background: #fafafa; }
    tr.stale td { background: #fffde7; }
    tr.stale:hover td { background: #fff9c4; }
    a { color: #1a73e8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .badge { display: inline-block; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; cursor: help; }
    .stale-badge { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
    .current-badge { background: #d4edda; color: #155724; border: 1px solid #28a745; }
    .count { color: #555; font-size: 0.9rem; margin-bottom: 0.5rem; }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; color: #777; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>Boston Camp Finder</h1>
  <p class="subtitle">Kids' camps near Roslindale, aggregated weekly from 16 Boston-area organizations. Always verify details directly with the camp.</p>

  <div class="filters">
    <label>
      Type:
      <select id="filter-type">
        <option value="">All types</option>
      </select>
    </label>
    <label>
      Max distance:
      <select id="filter-distance">
        <option value="">Any distance</option>
        <option value="2">Within 2 miles</option>
        <option value="5">Within 5 miles</option>
        <option value="7" selected>Within 7 miles</option>
      </select>
    </label>
    <label>
      Search:
      <input type="text" id="filter-search" placeholder="Camp name or organization…" style="width:220px" />
    </label>
  </div>

  <div class="count" id="result-count"></div>

  <table>
    <thead>
      <tr>
        <th>Camp Name</th>
        <th>Organization</th>
        <th>Type</th>
        <th>Neighborhood</th>
        <th>Distance</th>
        <th>Ages</th>
        <th>Hours</th>
        <th>Weeks Available</th>
        <th>Cost/Week</th>
        <th>Signup Opens</th>
        <th>Aid?</th>
        <th>Register</th>
        <th>Data Year</th>
      </tr>
    </thead>
    <tbody id="camp-tbody"></tbody>
  </table>

  <footer>
    Data scraped weekly via GitHub Actions using Claude. Information may be from a prior year — check directly with each camp before registering.
    <span id="footer-last-scraped"></span>
  </footer>

  <script>
    let campsData = [];

    async function loadData() {
      try {
        const res = await fetch('data.json');
        campsData = await res.json();
      } catch (e) {
        campsData = [];
      }
      populateTypeFilter();
      applyFilters();
      updateFooterDate();
    }

    function populateTypeFilter() {
      const types = [...new Set(campsData.map(c => c.camp_type).filter(Boolean))].sort();
      const sel = document.getElementById('filter-type');
      types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
      });
    }

    function applyFilters() {
      const typeFilter = document.getElementById('filter-type').value;
      const maxDist = parseFloat(document.getElementById('filter-distance').value) || Infinity;
      const search = document.getElementById('filter-search').value.toLowerCase().trim();

      const filtered = campsData.filter(c => {
        if (typeFilter && c.camp_type !== typeFilter) return false;
        if (c.distance_from_roslindale_miles != null && c.distance_from_roslindale_miles > maxDist) return false;
        if (search) {
          const hay = `${c.camp_name || ''} ${c.organization || ''}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      });

      renderTable(filtered);
      document.getElementById('result-count').textContent =
        `Showing ${filtered.length} of ${campsData.length} camps`;
    }

    function renderTable(camps) {
      const tbody = document.getElementById('camp-tbody');
      tbody.innerHTML = '';

      if (!camps.length) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:2rem;color:#888">No camps match your filters.</td></tr>';
        return;
      }

      camps.forEach(c => {
        const tr = document.createElement('tr');
        if (c.data_is_stale) tr.classList.add('stale');

        const dist = c.distance_from_roslindale_miles != null
          ? `${c.distance_from_roslindale_miles} mi` : '—';

        const yearCell = c.data_is_stale
          ? `<span class="badge stale-badge" title="Info from ${c.data_year}. Verify with camp directly.">${c.data_year} ⚠</span>`
          : `<span class="badge current-badge">${c.data_year || '—'}</span>`;

        const aid = c.financial_aid_available === true ? 'Yes'
          : c.financial_aid_available === false ? 'No' : '—';

        tr.innerHTML = `
          <td><a href="${esc(c.website_url)}" target="_blank" rel="noopener">${esc(c.camp_name)}</a></td>
          <td>${esc(c.organization)}</td>
          <td>${esc(c.camp_type)}</td>
          <td>${esc(c.neighborhood)}</td>
          <td>${dist}</td>
          <td>${esc(c.age_range)}</td>
          <td>${esc(c.hours_of_day)}</td>
          <td>${esc(c.weeks_available)}</td>
          <td>${esc(c.cost_per_week)}</td>
          <td>${esc(c.signup_opens)}</td>
          <td>${aid}</td>
          <td>${c.signup_url ? `<a href="${esc(c.signup_url)}" target="_blank" rel="noopener">Register →</a>` : '—'}</td>
          <td>${yearCell}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    function esc(val) {
      if (val == null) return '—';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function updateFooterDate() {
      const dates = campsData.map(c => c.last_scraped).filter(Boolean).sort();
      if (dates.length) {
        const d = new Date(dates[dates.length - 1]);
        document.getElementById('footer-last-scraped').textContent =
          ` Last scraped: ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;
      }
    }

    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-distance').addEventListener('change', applyFilters);
    document.getElementById('filter-search').addEventListener('input', applyFilters);

    loadData();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify the page renders locally**

Open `index.html` in a browser (it will show "No camps match your filters" since `data.json` is empty — that's correct).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: single-page camp table with filtering and stale-data indicators"
```

---

## Task 8: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/scrape.yml`

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create .github/workflows/scrape.yml**

```yaml
name: Scrape Camp Data

on:
  schedule:
    - cron: '0 11 * * 0'   # Sundays 6am ET (UTC-5 in winter, UTC-4 in summer)
  workflow_dispatch:          # enable manual trigger from GitHub Actions tab

jobs:
  scrape:
    runs-on: ubuntu-latest

    permissions:
      contents: write         # needed to commit data.json back to repo

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Set up Python 3.13
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run scraper
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python -m scraper.scraper

      - name: Commit updated data.json
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data.json
          if git diff --staged --quiet; then
            echo "No changes to data.json — skipping commit"
          else
            git commit -m "chore: update camp data $(date -u '+%Y-%m-%d') [skip ci]"
            git push
          fi
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/scrape.yml
git commit -m "feat: weekly GitHub Actions scrape workflow"
```

---

## Task 9: GitHub Repository Setup and Deployment

- [ ] **Step 1: Create public GitHub repository**

```bash
gh repo create boston-camp-finder --public --description "Boston-area kids' camp aggregator, updated weekly"
```

Expected output: Repository URL printed, e.g. `https://github.com/timothyhall/boston-camp-finder`

- [ ] **Step 2: Push code to GitHub**

```bash
git remote add origin https://github.com/timothyhall/boston-camp-finder.git
git push -u origin main
```

Expected: all commits pushed successfully.

- [ ] **Step 3: Enable GitHub Pages**

```bash
gh api repos/timothyhall/boston-camp-finder/pages \
  --method POST \
  --field source='{"branch":"main","path":"/"}'
```

Expected: `201 Created` response. GitHub Pages will be live at `https://timothyhall.github.io/boston-camp-finder/` within a minute or two.

- [ ] **Step 4: Add ANTHROPIC_API_KEY secret**

```bash
gh secret set ANTHROPIC_API_KEY --repo timothyhall/boston-camp-finder
```

When prompted, paste your Anthropic API key. It will not be echoed.

- [ ] **Step 5: Verify the site is live**

Open `https://timothyhall.github.io/boston-camp-finder/` in a browser. You should see the camp table (empty until the first scrape runs).

- [ ] **Step 6: Run the first scrape manually**

From the GitHub Actions tab → "Scrape Camp Data" → "Run workflow". This triggers an immediate scrape without waiting for Sunday.

- [ ] **Step 7: Add your collaborator**

```bash
gh api repos/timothyhall/boston-camp-finder/collaborators/<FRIEND_GITHUB_USERNAME> \
  --method PUT \
  --field permission=push
```

Replace `<FRIEND_GITHUB_USERNAME>` with your friend's GitHub username.

- [ ] **Step 8: Final commit (README placeholder)**

Create a minimal `README.md`:

```markdown
# Boston Camp Finder

Weekly-updated aggregator of kids' camps near Roslindale, MA.

**Live site:** https://timothyhall.github.io/boston-camp-finder/

Data is scraped every Sunday from 16 Boston-area organizations using Claude for extraction.
To add a new source, add one entry to `scraper/sources.py`.
```

```bash
git add README.md
git commit -m "docs: add README"
git push
```

---

## Self-Review Notes

- All 16 sources from spec are present in Task 4 (`sources.py`)
- All data fields from spec are in the extractor prompt and rendered in `index.html`
- `data_is_stale` / `data_year` logic covered in extractor tests and rendered with badge in HTML
- Max depth of 3 hops enforced in scraper and tested
- `distance_from_roslindale_miles` added post-extraction in orchestrator
- `last_scraped` added post-extraction in orchestrator
- GitHub Actions secret (`ANTHROPIC_API_KEY`) never committed — only in GitHub Secrets
- GitHub Pages serves from root of `main` branch — no build step needed
- `[skip ci]` in the weekly commit message prevents an infinite loop of triggered runs
- Source URLs in `sources.py` are best-known starting points and should be verified before first scrape run
