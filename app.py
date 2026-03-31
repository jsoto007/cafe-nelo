"""Compatibility entrypoint for WSGI servers launched from the repository root.

Render is currently starting Gunicorn with ``app:app`` from the repo root, so
this module proxies the real Flask application defined under ``server/app``.
"""

import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLIENT_DIR = ROOT / "client"
CLIENT_DIST = CLIENT_DIR / "dist"


def _ensure_client_bundle() -> None:
    if CLIENT_DIST.exists():
        return

    # Render booted the API without the frontend bundle. Try to build it in-place
    # so the Flask fallback can serve the SPA instead of the JSON error response.
    if os.getenv("RENDER", "").lower() not in {"1", "true", "yes"}:
        return

    npm = shutil.which("npm")
    if npm is None:
        print("client/dist is missing and npm is unavailable; skipping client build", flush=True)
        return

    try:
        subprocess.run([npm, "ci", "--prefix", str(CLIENT_DIR)], check=True)
        subprocess.run([npm, "run", "build", "--prefix", str(CLIENT_DIR)], check=True)
    except subprocess.CalledProcessError as exc:
        print(f"client build failed on boot: {exc}", flush=True)


_ensure_client_bundle()

from server.app import create_app
from server.app.config import db

app = create_app()

__all__ = ["app", "create_app", "db"]
