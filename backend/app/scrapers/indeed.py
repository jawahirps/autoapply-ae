import requests
import time
import feedparser
from bs4 import BeautifulSoup
from typing import List, Dict
from .base import HEADERS, clean_text, make_job_id

# Indeed blocks most direct scraping — try multiple URL patterns
INDEED_RSS_URLS = [
    "https://www.indeed.com/rss?q={q}&l=United+Arab+Emirates&sort=date&limit=50",
    "https://ae.indeed.com/rss?q={q}&l=UAE&sort=date",
    "https://www.indeed.com/rss?q={q}&l=Dubai&sort=date",
]

SESSION_HEADERS = {
    **HEADERS,
    "Referer": "https://www.google.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
}


def scrape_indeed_jobs(keywords: str, location: str = "United Arab Emirates", max_results: int = 50) -> List[Dict]:
    jobs = []
    q = requests.utils.quote(keywords)

    # 1. Try RSS feeds (fastest, no JS needed)
    for rss_template in INDEED_RSS_URLS:
        if jobs:
            break
        try:
            rss_url = rss_template.format(q=q)
            feed = feedparser.parse(rss_url)
            for entry in feed.entries[:max_results]:
                raw_link = entry.get("link", "")
                summary = clean_text(
                    BeautifulSoup(entry.get("summary", ""), "html.parser").get_text()
                )
                # Extract company from title like "Job Title - Company Name"
                raw_title = clean_text(entry.get("title", ""))
                parts = raw_title.rsplit(" - ", 1)
                title = parts[0] if parts else raw_title
                company = parts[1] if len(parts) > 1 else ""

                job_id = make_job_id("indeed", raw_link or raw_title)
                jobs.append({
                    "external_id": job_id,
                    "source": "indeed",
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": summary[:2000],
                    "requirements": "",
                    "salary": "",
                    "job_type": "",
                    "experience_level": "",
                    "url": raw_link,
                    "apply_url": raw_link,
                    "easy_apply": False,
                    "posted_date": entry.get("published", ""),
                })
        except Exception:
            continue

    if jobs:
        return jobs[:max_results]

    # 2. Try scraping with session
    try:
        session = requests.Session()
        session.headers.update(SESSION_HEADERS)
        # Prime cookies with homepage visit
        session.get("https://www.indeed.com/", timeout=10)
        time.sleep(1)
        url = f"https://www.indeed.com/jobs?q={q}&l=United+Arab+Emirates&sort=date"
        resp = session.get(url, timeout=15)

        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.select('[data-jk], .job_seen_beacon, .jobsearch-ResultsList > li')
            for card in cards[:max_results]:
                try:
                    title_el = card.find("h2") or card.find(class_=lambda c: c and "title" in str(c).lower())
                    company_el = card.find(class_=lambda c: c and "company" in str(c).lower())
                    loc_el = card.find(class_=lambda c: c and "location" in str(c).lower())
                    link_el = card.find("a", href=True)

                    title = clean_text(title_el.get_text() if title_el else "")
                    if not title:
                        continue

                    link = link_el["href"] if link_el else ""
                    if link and not link.startswith("http"):
                        link = "https://www.indeed.com" + link

                    job_id = make_job_id("indeed", link or title)
                    jobs.append({
                        "external_id": job_id,
                        "source": "indeed",
                        "title": title,
                        "company": clean_text(company_el.get_text() if company_el else ""),
                        "location": clean_text(loc_el.get_text() if loc_el else location),
                        "description": "",
                        "requirements": "",
                        "salary": "",
                        "job_type": "",
                        "experience_level": "",
                        "url": link,
                        "apply_url": link,
                        "easy_apply": False,
                        "posted_date": "",
                    })
                except Exception:
                    continue
    except Exception:
        pass

    return jobs[:max_results]
