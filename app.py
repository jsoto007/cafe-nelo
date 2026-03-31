"""Compatibility entrypoint for WSGI servers launched from the repository root.

Render is currently starting Gunicorn with ``app:app`` from the repo root, so
this module proxies the real Flask application defined under ``server/app``.
"""

from server.app import create_app
from server.app.config import db

app = create_app()

__all__ = ["app", "create_app", "db"]
