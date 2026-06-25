import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.database import engine
from app import models
from app.routers import resume, jobs, applications
from app.config import UPLOAD_PATH

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UAE Job Applicator Portal",
    description="Automatically search and apply to jobs across UAE job boards",
    version="1.0.0",
)

# In production (Railway) allow all origins; locally restrict to dev ports
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("RAILWAY_ENVIRONMENT") else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(applications.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "UAE Job Applicator API running"}


# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_PATH)), name="uploads")

# --- Serve React frontend (production build) ---
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Catch-all: serve index.html for all non-API routes (SPA routing)."""
        file = FRONTEND_DIST / full_path
        if file.exists() and file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
