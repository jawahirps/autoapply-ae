#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "🇦🇪 UAE Job Applicator Portal"
echo "================================"

# ── Backend ──────────────────────────────────────────────────
echo "▶ Setting up Python backend..."
cd backend

if [ ! -d ".venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
echo "  Installing Python dependencies..."
pip install -q -r requirements.txt

echo "  Starting FastAPI server on http://localhost:8000 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
cd ..

# ── Frontend ──────────────────────────────────────────────────
echo "▶ Setting up React frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install
fi

echo "  Starting Vite dev server on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "✅ Portal running!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait and forward Ctrl+C
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait $BACKEND_PID $FRONTEND_PID
