import os
import re
from typing import Optional

import anthropic
import psycopg2
import psycopg2.extras

_RESOLVER_PROMPT = """\
Find the official website URL for a kids' summer camp called "{camp_name}" near Boston, MA.

Search for it and return ONLY the main website URL (e.g., https://example.com) with no other text.
If you cannot find a credible official website for this specific camp, return exactly: NOT_FOUND"""


def resolve_suggestions(client: anthropic.Anthropic) -> list[dict]:
    """
    Fetch unprocessed suggestions from the DB, resolve URLs via Claude web_search,
    and return a list of {name, url, submission_id} dicts ready for scraping.
    """
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("  [suggestions] DATABASE_URL not set; skipping")
        return []

    conn = psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, camp_name, camp_url
            FROM submissions
            WHERE type = 'suggestion'
              AND camp_name IS NOT NULL
              AND scrape_status IS NULL
        """)
        rows = cur.fetchall()

        if not rows:
            return []

        print(f"  [suggestions] {len(rows)} unprocessed suggestion(s) found")
        resolved = []

        for row in rows:
            submission_id = row["id"]
            camp_name = row["camp_name"]
            camp_url = row["camp_url"]

            if not camp_url:
                camp_url = _find_camp_url(client, camp_name)

            if camp_url:
                cur.execute(
                    "UPDATE submissions SET camp_url = %s, scrape_status = 'pending' WHERE id = %s",
                    (camp_url, submission_id),
                )
                resolved.append({"name": camp_name, "url": camp_url, "submission_id": submission_id})
                print(f"  [suggestions] '{camp_name}' → {camp_url}")
            else:
                cur.execute(
                    "UPDATE submissions SET scrape_status = 'not_found', scraped_at = now() WHERE id = %s",
                    (submission_id,),
                )
                print(f"  [suggestions] No URL found for '{camp_name}'")

        conn.commit()
        return resolved
    finally:
        conn.close()


def mark_suggestion_scraped(submission_id: int, found: bool) -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        return

    status = "found" if found else "not_found"
    conn = psycopg2.connect(database_url)
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE submissions SET scrape_status = %s, scraped_at = now() WHERE id = %s",
            (status, submission_id),
        )
        conn.commit()
    finally:
        conn.close()


def _find_camp_url(client: anthropic.Anthropic, camp_name: str) -> Optional[str]:
    prompt = _RESOLVER_PROMPT.format(camp_name=camp_name)
    try:
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=256,
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 3, "allowed_callers": ["direct"]}],
            messages=[{"role": "user", "content": prompt}],
        )
        for block in reversed(message.content):
            if hasattr(block, "text"):
                text = block.text.strip()
                if text == "NOT_FOUND":
                    return None
                urls = re.findall(r"https?://[^\s<>\"']+", text)
                if urls:
                    return urls[0].rstrip(".,)")
        return None
    except Exception as e:
        print(f"  [suggestions] web_search error for '{camp_name}': {e}")
        return None
