import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from .base import HEADERS, clean_text, make_job_id
from .demo import get_demo_jobs


def scrape_gulftlent_jobs(keywords: str, location: str = "UAE", max_results: int = 50) -> List[Dict]:
    jobs = []

    try:
        url = (
            f"https://www.gulftalent.com/jobs"
            f"?search={requests.utils.quote(keywords)}&country=uae"
        )
        resp = requests.get(url, headers=HEADERS, timeout=15)

        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            cards = (
                soup.find_all("div", class_=lambda c: c and "job" in str(c).lower() and ("item" in str(c).lower() or "card" in str(c).lower()))
                or soup.select('article, [class*="job-listing"], [class*="jobItem"]')
            )
            for card in cards[:max_results]:
                try:
                    title_el = card.find("h2") or card.find("h3") or card.find(class_=lambda c: c and "title" in str(c).lower())
                    company_el = card.find(class_=lambda c: c and "company" in str(c).lower())
                    loc_el = card.find(class_=lambda c: c and "location" in str(c).lower())
                    link_el = card.find("a", href=True)
                    date_el = card.find(class_=lambda c: c and "date" in str(c).lower())

                    title = clean_text(title_el.get_text() if title_el else "")
                    if not title:
                        continue

                    link = link_el["href"] if link_el else ""
                    if link and not link.startswith("http"):
                        link = "https://www.gulftalent.com" + link

                    jobs.append({
                        "external_id": make_job_id("gulftalent", link or f"{title}_{company_el}"),
                        "source": "gulftalent",
                        "title": title,
                        "company": clean_text(company_el.get_text() if company_el else ""),
                        "location": clean_text(loc_el.get_text() if loc_el else "UAE"),
                        "description": "",
                        "requirements": "",
                        "salary": "",
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

    if not jobs:
        jobs = get_demo_jobs("gulftalent", keywords, max_results)

    return jobs[:max_results]
