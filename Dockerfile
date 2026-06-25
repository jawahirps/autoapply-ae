# ── Stage 1: Build React frontend ────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend + bundled frontend ────────────────
FROM python:3.11-slim
WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY backend/ ./backend/

# React build output
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Persistent data dirs
RUN mkdir -p /app/data /app/uploads

ENV PYTHONPATH=/app/backend
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/uploads
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
