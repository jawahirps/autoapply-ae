import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Respect env-var overrides (set by Docker / Railway)
_data_dir  = os.getenv("DATA_DIR")
_upload_dir = os.getenv("UPLOAD_DIR")

DATA_PATH   = Path(_data_dir)   if _data_dir   else BASE_DIR / "data"
UPLOAD_PATH = Path(_upload_dir) if _upload_dir else BASE_DIR / "uploads"

DATA_PATH.mkdir(parents=True, exist_ok=True)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
