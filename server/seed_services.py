"""Seed the database with the restaurant's reservation options.

Usage:
    python seed_services.py

Run from the /server directory after applying migrations.
Existing services are left untouched — only missing ones are inserted.
"""

import os
import sys

# Resolve the server package regardless of working directory.
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.config import db
from app.models import SessionOption

SERVICES = [
    {
        "name": "Chef's Tasting Menu",
        "tagline": "The full experience",
        "description": (
            "A multi-course progression curated by the kitchen — seasonal, composed, and paired on request. "
            "Designed for guests who want to leave the decisions to us."
        ),
        "category": "Tasting",
        "duration_minutes": 150,
        "price_cents": 12500,
    },
    {
        "name": "Private Dining Experience",
        "tagline": "The room is yours",
        "description": (
            "Exclusive use of our private dining room for up to 14 guests. Custom menu, "
            "dedicated service staff, and full beverage program coordination."
        ),
        "category": "Private Events",
        "duration_minutes": 180,
        "price_cents": 0,
    },
    {
        "name": "Wine Pairing Dinner",
        "tagline": "Glass for glass",
        "description": (
            "A four-course dinner with sommelier-selected wines poured alongside each course. "
            "Available by reservation for two or more guests."
        ),
        "category": "Tasting",
        "duration_minutes": 120,
        "price_cents": 9500,
    },
    {
        "name": "Brunch Reservation",
        "tagline": "Weekend mornings done right",
        "description": (
            "Weekend brunch service. Reserve ahead for parties of four or more — "
            "walk-ins welcome based on availability."
        ),
        "category": "Dining",
        "duration_minutes": 90,
        "price_cents": 0,
    },
    {
        "name": "Bar Counter Seating",
        "tagline": "Front row at the pass",
        "description": (
            "Up to four seats at the chef's bar counter, offering an intimate view of the kitchen "
            "and a more casual, conversational dining experience."
        ),
        "category": "Dining",
        "duration_minutes": 90,
        "price_cents": 0,
    },
]


def seed():
    app = create_app()
    with app.app_context():
        existing_names = {
            row.name.strip().lower()
            for row in SessionOption.query.with_entities(SessionOption.name).all()
            if row.name
        }

        inserted = 0
        for svc in SERVICES:
            if svc["name"].strip().lower() in existing_names:
                print(f"  skip  {svc['name']} (already exists)")
                continue

            option = SessionOption(
                name=svc["name"],
                tagline=svc["tagline"],
                description=svc["description"],
                category=svc["category"],
                duration_minutes=svc["duration_minutes"],
                price_cents=svc["price_cents"],
                is_active=True,
            )
            db.session.add(option)
            inserted += 1
            print(f"  added {svc['name']}  ({svc['duration_minutes']}min · ${svc['price_cents'] / 100:.0f})")

        db.session.commit()
        print(f"\nDone — {inserted} service(s) added, {len(SERVICES) - inserted} skipped.")


if __name__ == "__main__":
    seed()
