import json
import re
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
  "follow_up_urls": ["up to 8 URLs on this page that likely lead to more camp details, registration, pricing, dates, or location pages"],
  "has_sufficient_data": "boolean - true if camps array has useful, reasonably complete information"
}}

Current year is {current_year}. If schedules or registration dates appear to be from {prior_year} or earlier, set data_is_stale to true and data_year to that year.
If this page is a directory or landing page, include high-confidence camp detail links in follow_up_urls even when camps has some useful data.

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
            model="claude-haiku-4-5",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text)
    except json.JSONDecodeError as e:
        preview = text[:200] if text else "<empty>"
        print(f"  [extractor error] {type(e).__name__}: {e} | response preview: {preview!r}")
        return dict(_EMPTY_RESULT)
    except Exception as e:
        print(f"  [extractor error] {type(e).__name__}: {e}")
        return dict(_EMPTY_RESULT)
