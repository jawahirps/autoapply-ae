"""Core API tests — health, jobs, applications, journal."""
import pytest
from tests.conftest import TestSession
from app.models import Job


# ── Helpers ───────────────────────────────────────────────────

def _insert_job(title="Software Engineer", company="Acme", source="bayt"):
    """Directly insert a Job row, bypassing the scraper (no network)."""
    db = TestSession()
    job = Job(
        external_id=f"test-{title}-{company}",
        source=source,
        title=title,
        company=company,
        location="Dubai, UAE",
        url="https://example.com/job",
        apply_url="https://example.com/apply",
        match_score=75.0,
        skills_matched=["Python"],
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job_id = job.id
    db.close()
    return job_id


# ── Health ────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Jobs ─────────────────────────────────────────────────────

def test_list_jobs_empty(client):
    r = client.get("/api/jobs/list")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["jobs"] == []


def test_list_jobs_with_data(client):
    _insert_job("Data Scientist", "Emirates Group")
    r = client.get("/api/jobs/list")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["jobs"][0]["title"] == "Data Scientist"


def test_job_stats_empty(client):
    r = client.get("/api/jobs/stats/summary")
    assert r.status_code == 200
    body = r.json()
    assert "total" in body or isinstance(body, dict)
    assert body.get("total", 0) == 0


def test_get_job(client):
    job_id = _insert_job("Cloud Architect", "G42")
    r = client.get(f"/api/jobs/{job_id}")
    assert r.status_code == 200
    assert r.json()["company"] == "G42"


def test_get_job_not_found(client):
    r = client.get("/api/jobs/99999")
    assert r.status_code == 404


# ── Applications ──────────────────────────────────────────────

def test_apply_to_job(client):
    job_id = _insert_job()
    r = client.post("/api/applications/apply", json={"job_id": job_id})
    assert r.status_code == 200
    data = r.json()
    assert "application_id" in data
    assert data["application_id"] > 0


def test_apply_duplicate_returns_existing(client):
    job_id = _insert_job()
    r1 = client.post("/api/applications/apply", json={"job_id": job_id})
    r2 = client.post("/api/applications/apply", json={"job_id": job_id})
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["application_id"] == r2.json()["application_id"]


def test_apply_unknown_job(client):
    r = client.post("/api/applications/apply", json={"job_id": 99999})
    assert r.status_code == 404


def test_list_applications(client):
    job_id = _insert_job()
    client.post("/api/applications/apply", json={"job_id": job_id})
    r = client.get("/api/applications/list")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["applications"][0]["job_id"] == job_id


def test_update_application_status(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    r = client.patch(f"/api/applications/{app_id}/status", params={"status": "interview"})
    assert r.status_code == 200
    assert r.json()["status"] == "interview"


def test_update_application_invalid_status(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    r = client.patch(f"/api/applications/{app_id}/status", params={"status": "nonsense"})
    assert r.status_code == 400


def test_delete_application(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    r = client.delete(f"/api/applications/{app_id}")
    assert r.status_code == 200
    assert client.get("/api/applications/list").json()["total"] == 0


# ── Journal ───────────────────────────────────────────────────

def test_add_and_list_journal_entries(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]

    r = client.post(f"/api/journal/{app_id}", json={"entry_type": "call", "title": "HR called", "body": "Screening done"})
    assert r.status_code == 200
    entry = r.json()
    assert entry["title"] == "HR called"
    assert entry["entry_type"] == "call"

    entries = client.get(f"/api/journal/{app_id}").json()
    assert len(entries) == 1


def test_journal_invalid_entry_type(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    r = client.post(f"/api/journal/{app_id}", json={"entry_type": "shrug", "title": "test"})
    assert r.status_code == 400


def test_journal_unknown_application(client):
    r = client.post("/api/journal/99999", json={"entry_type": "note", "title": "ghost"})
    assert r.status_code == 404


def test_delete_journal_entry(client):
    job_id = _insert_job()
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    entry_id = client.post(f"/api/journal/{app_id}", json={"entry_type": "note", "title": "temp"}).json()["id"]

    r = client.delete(f"/api/journal/entry/{entry_id}")
    assert r.status_code == 200
    assert client.get(f"/api/journal/{app_id}").json() == []


def test_delete_application_cascades_journal(client):
    """Deleting an application must remove its journal entries."""
    job_id = _insert_job("DevOps Engineer", "Careem")
    app_id = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    client.post(f"/api/journal/{app_id}", json={"entry_type": "note", "title": "will be gone"})

    client.delete(f"/api/applications/{app_id}")

    # Re-apply (SQLite may reuse the same row ID)
    app_id2 = client.post("/api/applications/apply", json={"job_id": job_id}).json()["application_id"]
    entries = client.get(f"/api/journal/{app_id2}").json()
    assert entries == [], "Stale journal entries leaked onto new application"
