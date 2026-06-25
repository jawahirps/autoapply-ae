from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import Application, Job, Resume, JournalEntry
from app.apply.email_apply import generate_cover_letter, extract_email_from_description

router = APIRouter(prefix="/api/applications", tags=["applications"])


class ApplyRequest(BaseModel):
    job_id: int
    method: str = "manual"  # manual, email, auto
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    # Email settings (for email method)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 465
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None


class BulkApplyRequest(BaseModel):
    job_ids: List[int]
    method: str = "manual"
    min_score: Optional[float] = None


@router.post("/apply")
def apply_to_job(req: ApplyRequest, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    # Check if already applied
    existing = db.query(Application).filter(
        Application.job_id == req.job_id,
        Application.status != "rejected"
    ).first()
    if existing:
        return {"message": "Already applied", "application_id": existing.id}

    resume = db.query(Resume).filter(Resume.is_active == True).order_by(Resume.id.desc()).first()
    resume_dict = {
        "name": resume.name if resume else "",
        "skills": resume.skills if resume else [],
        "raw_text": resume.raw_text if resume else "",
    } if resume else {}

    cover_letter = req.cover_letter or generate_cover_letter(resume_dict, {
        "title": job.title, "company": job.company
    })

    if req.method == "email" and req.smtp_host:
        from app.apply.email_apply import send_email_application
        to_email = extract_email_from_description(job.description)
        if not to_email:
            raise HTTPException(400, "No email found in job description for email apply")
        success = send_email_application(
            smtp_host=req.smtp_host,
            smtp_port=req.smtp_port or 465,
            smtp_user=req.smtp_user,
            smtp_password=req.smtp_password,
            to_email=to_email,
            resume=resume_dict,
            job={"title": job.title, "company": job.company},
            resume_file_path=resume.file_path if resume else "",
            cover_letter=cover_letter,
        )
        if not success:
            raise HTTPException(500, "Failed to send email application")

    app = Application(
        job_id=req.job_id,
        resume_id=resume.id if resume else None,
        source=job.source,
        job_title=job.title,
        company=job.company,
        job_url=job.url,
        status="applied",
        applied_method=req.method,
        cover_letter=cover_letter,
        notes=req.notes,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return {"message": "Application recorded", "application_id": app.id, "apply_url": job.apply_url}


@router.post("/bulk-apply")
def bulk_apply(req: BulkApplyRequest, db: Session = Depends(get_db)):
    results = []
    for job_id in req.job_ids:
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                continue
            if req.min_score and job.match_score < req.min_score:
                continue
            existing = db.query(Application).filter(Application.job_id == job_id).first()
            if existing:
                results.append({"job_id": job_id, "status": "already_applied"})
                continue
            resume = db.query(Resume).filter(Resume.is_active == True).first()
            app = Application(
                job_id=job_id,
                resume_id=resume.id if resume else None,
                source=job.source,
                job_title=job.title,
                company=job.company,
                job_url=job.url,
                status="applied",
                applied_method=req.method,
            )
            db.add(app)
            results.append({"job_id": job_id, "status": "applied", "title": job.title, "company": job.company})
        except Exception as e:
            results.append({"job_id": job_id, "status": "error", "error": str(e)})

    db.commit()
    applied = [r for r in results if r["status"] == "applied"]
    return {"total": len(results), "applied": len(applied), "results": results}


@router.get("/list")
def list_applications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    total = query.count()
    apps = query.order_by(Application.applied_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "page": page, "applications": apps}


@router.patch("/{app_id}/status")
def update_status(app_id: int, status: str, notes: Optional[str] = None, db: Session = Depends(get_db)):
    valid = {"applied", "viewed", "interview", "offered", "rejected", "withdrawn"}
    if status not in valid:
        raise HTTPException(400, f"Invalid status. Choose from: {', '.join(valid)}")
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = status
    if notes:
        app.notes = notes
    db.commit()
    return {"message": "Updated", "status": status}


@router.delete("/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    db.query(JournalEntry).filter(JournalEntry.application_id == app_id).delete()
    db.delete(app)
    db.commit()
    return {"message": "Deleted"}


@router.get("/stats/summary")
def application_stats(db: Session = Depends(get_db)):
    statuses = ["applied", "viewed", "interview", "offered", "rejected"]
    return {s: db.query(Application).filter(Application.status == s).count() for s in statuses}
