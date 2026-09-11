"""
Seed menu categories, menu items, and daily specials into the database.

The content and insert logic live in ``app/seed_content.py`` so the
``flask seed-if-empty`` CLI command can reuse them.

Run from the server/ directory:
    python seed_menu.py
"""

import os
import sys

# Ensure the app can be imported
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.seed_content import MENU, SPECIALS, seed_menu  # noqa: F401  (re-exported for seed.py)


def seed(app=None):
    app = app or create_app()
    with app.app_context():
        seed_menu()


if __name__ == "__main__":
    seed()
