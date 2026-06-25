from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON
from sqlalchemy.sql import func
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    file_path = Column(String(512))
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(100))
    location = Column(String(255))
    summary = Column(Text)
    skills = Column(JSON)
    experience = Column(JSON)
    education = Column(JSON)
    languages = Column(JSON)
    raw_text = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(255), unique=True, index=True)
    source = Column(String(100))  # linkedin, indeed, bayt, naukrigulf, gulftent
    title = Column(String(512))
    company = Column(String(255))
    location = Column(String(255))
    description = Column(Text)
    requirements = Column(Text)
    salary = Column(String(255))
    job_type = Column(String(100))  # full-time, part-time, contract
    experience_level = Column(String(100))
    url = Column(String(1024))
    apply_url = Column(String(1024))
    easy_apply = Column(Boolean, default=False)
    posted_date = Column(String(100))
    match_score = Column(Float, default=0.0)
    skills_matched = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer)
    resume_id = Column(Integer)
    source = Column(String(100))
    job_title = Column(String(512))
    company = Column(String(255))
    job_url = Column(String(1024))
    status = Column(String(100), default="applied")  # applied, viewed, interview, rejected, offered
    applied_method = Column(String(100))  # auto, manual, email
    cover_letter = Column(Text)
    notes = Column(Text)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
