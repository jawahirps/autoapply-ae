"""
Demo/sample jobs for boards that are currently blocked (Bayt, Naukrigulf, GulfTalent).
These are realistic placeholder entries so the UI is testable end-to-end.
In production, swap these out for a paid proxy or official API integration.
"""
from typing import List, Dict
from .base import make_job_id

SAMPLE_JOBS = [
    # Bayt samples
    {"source": "bayt", "title": "Senior Software Engineer", "company": "Careem", "location": "Dubai, UAE", "salary": "AED 25,000–35,000/mo", "job_type": "Full-time", "url": "https://www.bayt.com/en/uae/jobs/senior-software-engineer/"},
    {"source": "bayt", "title": "Data Scientist", "company": "Emirates Group", "location": "Dubai, UAE", "salary": "AED 20,000–30,000/mo", "job_type": "Full-time", "url": "https://www.bayt.com/en/uae/jobs/data-scientist/"},
    {"source": "bayt", "title": "Frontend Developer (React)", "company": "noon", "location": "Dubai, UAE", "salary": "AED 18,000–25,000/mo", "job_type": "Full-time", "url": "https://www.bayt.com/en/uae/jobs/frontend-developer/"},
    {"source": "bayt", "title": "DevOps Engineer", "company": "du Telecom", "location": "Abu Dhabi, UAE", "salary": "AED 22,000–32,000/mo", "job_type": "Full-time", "url": "https://www.bayt.com/en/uae/jobs/devops-engineer/"},
    {"source": "bayt", "title": "Product Manager", "company": "Talabat", "location": "Dubai, UAE", "salary": "AED 28,000–40,000/mo", "job_type": "Full-time", "url": "https://www.bayt.com/en/uae/jobs/product-manager/"},
    # Naukrigulf samples
    {"source": "naukrigulf", "title": "Full Stack Developer", "company": "Etisalat", "location": "Abu Dhabi, UAE", "salary": "AED 15,000–22,000/mo", "job_type": "Full-time", "url": "https://www.naukrigulf.com/full-stack-developer-jobs-in-uae"},
    {"source": "naukrigulf", "title": "Business Analyst", "company": "ADNOC", "location": "Abu Dhabi, UAE", "salary": "AED 18,000–26,000/mo", "job_type": "Full-time", "url": "https://www.naukrigulf.com/business-analyst-jobs-in-uae"},
    {"source": "naukrigulf", "title": "Cloud Architect (AWS)", "company": "Accenture UAE", "location": "Dubai, UAE", "salary": "AED 30,000–45,000/mo", "job_type": "Full-time", "url": "https://www.naukrigulf.com/cloud-architect-jobs-in-uae"},
    {"source": "naukrigulf", "title": "UI/UX Designer", "company": "Majid Al Futtaim", "location": "Dubai, UAE", "salary": "AED 14,000–20,000/mo", "job_type": "Full-time", "url": "https://www.naukrigulf.com/ux-designer-jobs-in-uae"},
    {"source": "naukrigulf", "title": "Machine Learning Engineer", "company": "G42", "location": "Abu Dhabi, UAE", "salary": "AED 28,000–42,000/mo", "job_type": "Full-time", "url": "https://www.naukrigulf.com/machine-learning-engineer-jobs-in-uae"},
    # GulfTalent samples
    {"source": "gulftalent", "title": "Backend Engineer (Python)", "company": "Property Finder", "location": "Dubai, UAE", "salary": "AED 22,000–32,000/mo", "job_type": "Full-time", "url": "https://www.gulftalent.com/uae/jobs/backend-engineer"},
    {"source": "gulftalent", "title": "Finance Manager", "company": "Emaar Properties", "location": "Dubai, UAE", "salary": "AED 25,000–38,000/mo", "job_type": "Full-time", "url": "https://www.gulftalent.com/uae/jobs/finance-manager"},
    {"source": "gulftalent", "title": "Digital Marketing Manager", "company": "Chalhoub Group", "location": "Dubai, UAE", "salary": "AED 18,000–26,000/mo", "job_type": "Full-time", "url": "https://www.gulftalent.com/uae/jobs/digital-marketing-manager"},
    {"source": "gulftalent", "title": "Cybersecurity Analyst", "company": "DIFC", "location": "Dubai, UAE", "salary": "AED 20,000–30,000/mo", "job_type": "Full-time", "url": "https://www.gulftalent.com/uae/jobs/cybersecurity-analyst"},
    {"source": "gulftalent", "title": "HR Business Partner", "company": "Mashreq Bank", "location": "Dubai, UAE", "salary": "AED 16,000–22,000/mo", "job_type": "Full-time", "url": "https://www.gulftalent.com/uae/jobs/hr-business-partner"},
]

KEYWORD_MAP = {
    "software": ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer (Python)", "Frontend Developer (React)"],
    "engineer": ["Senior Software Engineer", "DevOps Engineer", "Cloud Architect (AWS)", "Machine Learning Engineer", "Backend Engineer (Python)"],
    "data": ["Data Scientist", "Machine Learning Engineer", "Business Analyst"],
    "frontend": ["Frontend Developer (React)", "UI/UX Designer"],
    "backend": ["Senior Software Engineer", "Backend Engineer (Python)", "Full Stack Developer"],
    "devops": ["DevOps Engineer", "Cloud Architect (AWS)"],
    "cloud": ["Cloud Architect (AWS)", "DevOps Engineer"],
    "product": ["Product Manager", "Business Analyst"],
    "design": ["UI/UX Designer", "Digital Marketing Manager"],
    "marketing": ["Digital Marketing Manager"],
    "finance": ["Finance Manager"],
    "manager": ["Product Manager", "Finance Manager", "Digital Marketing Manager", "HR Business Partner"],
    "security": ["Cybersecurity Analyst"],
    "machine learning": ["Machine Learning Engineer", "Data Scientist"],
    "python": ["Backend Engineer (Python)", "Machine Learning Engineer", "Senior Software Engineer"],
    "react": ["Frontend Developer (React)", "Full Stack Developer"],
    "hr": ["HR Business Partner"],
    "analyst": ["Business Analyst", "Data Scientist", "Cybersecurity Analyst"],
}


def get_demo_jobs(source: str, keywords: str, max_results: int = 10) -> List[Dict]:
    keywords_lower = keywords.lower()
    matched_titles = set()
    for kw, titles in KEYWORD_MAP.items():
        if kw in keywords_lower:
            matched_titles.update(titles)

    source_jobs = [j for j in SAMPLE_JOBS if j["source"] == source]
    if matched_titles:
        ordered = [j for j in source_jobs if j["title"] in matched_titles]
        ordered += [j for j in source_jobs if j["title"] not in matched_titles]
    else:
        ordered = source_jobs

    results = []
    for j in ordered[:max_results]:
        job_id = make_job_id(j["source"], j["url"])
        results.append({
            "external_id": job_id,
            "source": j["source"],
            "title": j["title"],
            "company": j["company"],
            "location": j["location"],
            "description": f"This is a sample listing from {j['source'].capitalize()} for testing purposes. In production, live scraping or a paid proxy API would return real data.",
            "requirements": "",
            "salary": j.get("salary", ""),
            "job_type": j.get("job_type", "Full-time"),
            "experience_level": "",
            "url": j["url"],
            "apply_url": j["url"],
            "easy_apply": False,
            "posted_date": "Recently",
        })
    return results
