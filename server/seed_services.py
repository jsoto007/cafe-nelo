"""Seed the database with the restaurant's reservation options.

Usage:
    python seed_services.py

Run from the /server directory after applying migrations.
Existing services are left untouched — only missing ones are inserted.
The content and insert logic live in ``app/seed_content.py``.
"""

import os
import sys

# Resolve the server package regardless of working directory.
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.seed_content import SERVICES, seed_services  # noqa: F401


def seed(app=None):
    app = app or create_app()
    with app.app_context():
        seed_services()


if __name__ == "__main__":
    seed()
