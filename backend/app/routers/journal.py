from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import JournalEntry, Application

router = APIRouter(prefix="/api/journal", tags=["journal"])

ENTRY_TYPES = {"note", "follow_up", "interview", "offer", "rejection", "call", "email"}


class EntryCreate(BaseModel):
    entry_type: str = "note"
    title: str
    body: Optional[str] = ""


@router.post("/{application_id}")
def add_entry(application_id: int, payload: EntryCreate, db: Session = Depends(get_db)):
    if not db.query(Application).filter(Application.id == application_id).first():
        raise HTTPException(404, "Application not found")
    if payload.entry_type not in ENTRY_TYPES:
        raise HTTPException(400, f"entry_type must be one of: {', '.join(sorted(ENTRY_TYPES))}")
    entry = JournalEntry(
        application_id=application_id,
        entry_type=payload.entry_type,
        title=payload.title,
        body=payload.body,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{application_id}")
def list_entries(application_id: int, db: Session = Depends(get_db)):
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.application_id == application_id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )


@router.delete("/entry/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}
