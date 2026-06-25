import re
from typing import List, Dict


def compute_match_score(resume: dict, job: dict) -> tuple[float, List[str]]:
    """Score how well a resume matches a job (0–100), return score and matched skills."""
    score = 0.0
    matched_skills = []

    resume_skills = [s.lower() for s in (resume.get("skills") or [])]
    resume_text = (resume.get("raw_text") or "").lower()
    job_text = (
        (job.get("title") or "") + " " +
        (job.get("description") or "") + " " +
        (job.get("requirements") or "")
    ).lower()

    if not job_text.strip():
        return 30.0, []

    # 1. Skills match (up to 60 pts)
    for skill in resume_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', job_text):
            matched_skills.append(skill)

    skill_score = min(60, len(matched_skills) * 8)
    score += skill_score

    # 2. Title keyword match (up to 20 pts)
    job_title_words = set(re.findall(r'\w+', (job.get("title") or "").lower()))
    resume_words = set(re.findall(r'\w+', resume_text[:3000]))
    title_overlap = job_title_words & resume_words - {"the", "and", "for", "with", "in", "of", "a"}
    title_score = min(20, len(title_overlap) * 4)
    score += title_score

    # 3. Experience keywords (up to 20 pts)
    exp_keywords = ["years", "experience", "senior", "junior", "manager", "lead", "specialist"]
    for kw in exp_keywords:
        if kw in job_text and kw in resume_text:
            score += 2

    return round(min(score, 100), 1), matched_skills


def rank_jobs(resume: dict, jobs: List[dict]) -> List[dict]:
    """Add match scores and sort jobs by relevance."""
    for job in jobs:
        score, matched = compute_match_score(resume, job)
        job["match_score"] = score
        job["skills_matched"] = matched
    return sorted(jobs, key=lambda j: j["match_score"], reverse=True)
