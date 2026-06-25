import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Resume
from app.resume.parser import parse_resume
from app.config import UPLOAD_PATH

router = APIRouter(prefix="/api/resume", tags=["resume"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Use PDF, DOCX, or TXT.")

    save_path = UPLOAD_PATH / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        parsed = parse_resume(str(save_path), file.filename)
    except Exception as e:
        raise HTTPException(422, f"Could not parse resume: {e}")

    # Deactivate previous active resumes
    db.query(Resume).filter(Resume.is_active == True).update({"is_active": False})

    resume = Resume(**parsed)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {"id": resume.id, "message": "Resume uploaded and parsed", "data": parsed}


@router.get("/active")
def get_active_resume(db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.is_active == True).order_by(Resume.id.desc()).first()
    if not resume:
        raise HTTPException(404, "No active resume found. Please upload one.")
    return resume


@router.get("/list")
def list_resumes(db: Session = Depends(get_db)):
    return db.query(Resume).order_by(Resume.id.desc()).all()


@router.get("/{resume_id}")
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found")
    return resume


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found")
    db.delete(resume)
    db.commit()
    return {"message": "Deleted"}
