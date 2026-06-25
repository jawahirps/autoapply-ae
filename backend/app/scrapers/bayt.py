import requests
import time
from bs4 import BeautifulSoup
from typing import List, Dict
from .base import HEADERS, clean_text, make_job_id
from .demo import get_demo_jobs

SESSION_HEADERS = {
    **HEADERS,
    "Referer": "https://www.google.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
}


def scrape_bayt_jobs(keywords: str, location: str = "uae", max_results: int = 50) -> List[Dict]:
    jobs = []
    keyword_slug = keywords.lower().replace(" ", "-")

    try:
        session = requests.Session()
        session.headers.update(SESSION_HEADERS)
        url = f"https://www.bayt.com/en/uae/jobs/{keyword_slug}-jobs/"
        resp = session.get(url, timeout=15)

        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            cards = (
                soup.find_all("li", attrs={"data-js-job": True})
                or soup.select('li[class*="has-pointer"]')
                or soup.select('[class*="job-item"], [class*="jobItem"]')
            )
            for card in cards[:max_results]:
                try:
                    title_el = card.find("h2") or card.find("h3") or card.find(class_=lambda c: c and "title" in str(c).lower())
                    company_el = card.find(class_=lambda c: c and ("company" in str(c).lower() or "employer" in str(c).lower()))
                    loc_el = card.find(class_=lambda c: c and "location" in str(c).lower())
                    link_el = card.find("a", href=True)
                    salary_el = card.find(class_=lambda c: c and "salary" in str(c).lower())
                    date_el = card.find(class_=lambda c: c and "date" in str(c).lower())

                    title = clean_text(title_el.get_text() if title_el else "")
                    if not title:
                        continue

                    link = link_el["href"] if link_el else ""
                    if link and not link.startswith("http"):
                        link = "https://www.bayt.com" + link

                    jobs.append({
                        "external_id": make_job_id("bayt", link or f"{title}_{company_el}"),
                        "source": "bayt",
                        "title": title,
                        "company": clean_text(company_el.get_text() if company_el else ""),
                        "location": clean_text(loc_el.get_text() if loc_el else "UAE"),
                        "description": "",
                        "requirements": "",
                        "salary": clean_text(salary_el.get_text() if salary_el else ""),
                        "job_type": "",
                        "experience_level": "",
                        "url": link,
                        "apply_url": link,
                        "easy_apply": False,
                        "posted_date": clean_text(date_el.get_text() if date_el else ""),
                    })
                except Exception:
                    continue
    except Exception:
        pass

    # Fall back to demo data if blocked or empty
    if not jobs:
        jobs = get_demo_jobs("bayt", keywords, max_results)

    return jobs[:max_results]
