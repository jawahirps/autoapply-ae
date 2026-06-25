import requests
import time
from bs4 import BeautifulSoup
from typing import List, Dict
from .base import HEADERS, clean_text, make_job_id

# LinkedIn guest API — no auth needed, returns real job data
GUEST_API = (
    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    "?keywords={keywords}&location={location}&start={start}"
)


def scrape_linkedin_jobs(keywords: str, location: str = "United Arab Emirates", max_results: int = 50) -> List[Dict]:
    jobs = []
    start = 0
    per_page = 10  # guest API returns ~10 per call

    while len(jobs) < max_results:
        url = GUEST_API.format(
            keywords=requests.utils.quote(keywords),
            location=requests.utils.quote(location),
            start=start,
        )
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("li")
            if not cards:
                break

            for card in cards:
                try:
                    title_el = (
                        card.find(class_=lambda c: c and "title" in str(c).lower())
                        or card.find("h3")
                        or card.find("a")
                    )
                    company_el = (
                        card.find(class_=lambda c: c and "company" in str(c).lower())
                        or card.find("h4")
                    )
                    location_el = card.find(class_=lambda c: c and "location" in str(c).lower())
                    link_el = card.find("a", href=True)
                    date_el = card.find("time") or card.find(class_=lambda c: c and "date" in str(c).lower())

                    title = clean_text(title_el.get_text() if title_el else "")
                    company = clean_text(company_el.get_text() if company_el else "")
                    loc = clean_text(location_el.get_text() if location_el else location)
                    link = link_el["href"] if link_el else ""
                    # Normalise link — strip tracking params
                    if link and "?" in link:
                        link = link.split("?")[0]
                    posted = clean_text(date_el.get_text() if date_el else "")

                    if not title or title.lower() in ("", "promoted"):
                        continue

                    job_id = make_job_id("linkedin", link or f"{title}_{company}")
                    jobs.append({
                        "external_id": job_id,
                        "source": "linkedin",
                        "title": title,
                        "company": company,
                        "location": loc or location,
                        "description": "",
                        "requirements": "",
                        "salary": "",
                        "job_type": "",
                        "experience_level": "",
                        "url": link,
                        "apply_url": link,
                        "easy_apply": False,
                        "posted_date": posted,
                    })
                except Exception:
                    continue

            if len(cards) < per_page:
                break
            start += per_page
            time.sleep(1)

        except Exception:
            break

    return jobs[:max_results]
