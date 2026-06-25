import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Job, Resume
from app.scrapers.linkedin import scrape_linkedin_jobs
from app.scrapers.indeed import scrape_indeed_jobs
from app.scrapers.bayt import scrape_bayt_jobs
from app.scrapers.naukrigulf import scrape_naukrigulf_jobs
from app.scrapers.gulftent import scrape_gulftlent_jobs
from app.apply.matcher import rank_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

SOURCES = {
    "linkedin": scrape_linkedin_jobs,
    "indeed": scrape_indeed_jobs,
    "bayt": scrape_bayt_jobs,
    "naukrigulf": scrape_naukrigulf_jobs,
    "gulftalent": scrape_gulftlent_jobs,
}


def _scrape_source(source: str, keywords: str, max_results: int) -> List[dict]:
    try:
        return SOURCES[source](keywords, max_results=max_results)
    except Exception as e:
        print(f"Scraper [{source}] error: {e}")
        return []


@router.post("/search")
def search_jobs(
    keywords: str = Query(..., description="Job title or skills to search"),
    sources: Optional[str] = Query("linkedin,indeed,bayt,naukrigulf,gulftalent", description="Comma-separated sources"),
    max_per_source: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db),
):
    active_resume = db.query(Resume).filter(Resume.is_active == True).order_by(Resume.id.desc()).first()
    selected_sources = [s.strip() for s in (sources or "").split(",") if s.strip() in SOURCES]
    if not selected_sources:
        selected_sources = list(SOURCES.keys())

    all_jobs = []
    with ThreadPoolExecutor(max_workers=len(selected_sources)) as executor:
        futures = {
            executor.submit(_scrape_source, src, keywords, max_per_source): src
            for src in selected_sources
        }
        for future in futures:
            result = future.result()
            all_jobs.extend(result)

    # Deduplicate by external_id
    seen = set()
    unique_jobs = []
    for job in all_jobs:
        if job["external_id"] not in seen:
            seen.add(job["external_id"])
            unique_jobs.append(job)

    # Rank by resume match
    if active_resume:
        resume_dict = {
            "skills": active_resume.skills or [],
            "raw_text": active_resume.raw_text or "",
        }
        unique_jobs = rank_jobs(resume_dict, unique_jobs)

    # Upsert into database
    saved_count = 0
    for job_data in unique_jobs:
        existing = db.query(Job).filter(Job.external_id == job_data["external_id"]).first()
        if existing:
            for k, v in job_data.items():
                if k not in ("id", "created_at") and v:
                    setattr(existing, k, v)
        else:
            db_job = Job(**job_data)
            db.add(db_job)
            saved_count += 1

    db.commit()

    # Reload from DB to get IDs
    ext_ids = [j["external_id"] for j in unique_jobs]
    db_jobs = db.query(Job).filter(Job.external_id.in_(ext_ids)).all()
    id_map = {j.external_id: j.id for j in db_jobs}
    for j in unique_jobs:
        j["id"] = id_map.get(j["external_id"])

    return {
        "total": len(unique_jobs),
        "new": saved_count,
        "sources": {src: len([j for j in unique_jobs if j["source"] == src]) for src in selected_sources},
        "jobs": unique_jobs,
    }


@router.get("/list")
def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=5, le=100),
    source: Optional[str] = None,
    min_score: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Job).filter(Job.is_active == True)
    if source:
        query = query.filter(Job.source == source)
    if min_score is not None:
        query = query.filter(Job.match_score >= min_score)
    total = query.count()
    jobs = query.order_by(Job.match_score.desc(), Job.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "page": page, "per_page": per_page, "jobs": jobs}


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    job.is_active = False
    db.commit()
    return {"message": "Job removed from list"}


@router.get("/stats/summary")
def job_stats(db: Session = Depends(get_db)):
    from app.models import Application
    total_jobs = db.query(Job).filter(Job.is_active == True).count()
    total_applied = db.query(Application).count()
    by_source = {}
    for src in SOURCES:
        by_source[src] = db.query(Job).filter(Job.source == src, Job.is_active == True).count()
    high_match = db.query(Job).filter(Job.match_score >= 70, Job.is_active == True).count()
    return {
        "total_jobs": total_jobs,
        "total_applied": total_applied,
        "high_match": high_match,
        "by_source": by_source,
    }
