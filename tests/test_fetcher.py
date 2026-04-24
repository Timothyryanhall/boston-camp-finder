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
