import requests
import time
from bs4 import BeautifulSoup
from typing import List, Dict
from .base import HEADERS, clean_text, make_job_id
from .demo import get_demo_jobs


def scrape_naukrigulf_jobs(keywords: str, location: str = "UAE", max_results: int = 50) -> List[Dict]:
    jobs = []
    keyword_slug = keywords.lower().replace(" ", "-")

    urls_to_try = [
        f"https://www.naukrigulf.com/{keyword_slug}-jobs-in-uae-1",
        f"https://www.naukrigulf.com/jobs-in-uae?searchType=jobsInLocation&location=uae&keyword={requests.utils.quote(keywords)}&page=1",
    ]

    for url in urls_to_try:
        if jobs:
            break
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20)
            if resp.status_code not in (200, 301, 302):
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = (
                soup.find_all("div", class_=lambda c: c and "ni-job-tuple" in str(c))
                or soup.find_all("article", class_=lambda c: c and "job" in str(c).lower())
                or soup.select('[class*="job-card"], [class*="jobCard"]')
            )

            for card in cards[:max_results]:
                try:
                    title_el = (
                        card.find("a", class_=lambda c: c and "title" in str(c).lower())
                        or card.find("h3") or card.find("h2")
                    )
                    company_el = card.find(class_=lambda c: c and ("company" in str(c).lower() or "org" in str(c).lower()))
                    loc_el = card.find(class_=lambda c: c and ("location" in str(c).lower() or "loc" in str(c).lower()))
                    link_el = card.find("a", href=True)
                    exp_el = card.find(class_=lambda c: c and "exp" in str(c).lower())
                    salary_el = card.find(class_=lambda c: c and "salary" in str(c).lower())
                    date_el = card.find(class_=lambda c: c and "date" in str(c).lower())

                    title = clean_text(title_el.get_text() if title_el else "")
                    if not title:
                        continue

                    link = link_el["href"] if link_el else ""
                    if link and not link.startswith("http"):
                        link = "https://www.naukrigulf.com" + link

                    jobs.append({
                        "external_id": make_job_id("naukrigulf", link or f"{title}_{company_el}"),
                        "source": "naukrigulf",
                        "title": title,
                        "company": clean_text(company_el.get_text() if company_el else ""),
                        "location": clean_text(loc_el.get_text() if loc_el else "UAE"),
                        "description": "",
                        "requirements": "",
                        "salary": clean_text(salary_el.get_text() if salary_el else ""),
                        "job_type": "",
                        "experience_level": clean_text(exp_el.get_text() if exp_el else ""),
                        "url": link,
                        "apply_url": link,
                        "easy_apply": False,
                        "posted_date": clean_text(date_el.get_text() if date_el else ""),
                    })
                except Exception:
                    continue
        except Exception:
            continue

    if not jobs:
        jobs = get_demo_jobs("naukrigulf", keywords, max_results)

    return jobs[:max_results]
