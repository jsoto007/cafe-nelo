import sys

from sqlalchemy.exc import SQLAlchemyError

sys.path.insert(0, "./server")

from app import create_app
from app.config import db


class _BrokenQuery:
    def filter_by(self, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def all(self):
        raise SQLAlchemyError("database unavailable")


class _OrderField:
    def asc(self):
        return self


class _FakeMenuCategory:
    query = _BrokenQuery()
    display_order = _OrderField()
    id = _OrderField()


class _FakeDailySpecialSection:
    query = _BrokenQuery()
    display_order = _OrderField()
    id = _OrderField()


def _build_app(monkeypatch):
    monkeypatch.setenv("DATABASE_URI", "sqlite+pysqlite:///:memory:")
    app = create_app()
    app.config.update(TESTING=True, WTF_CSRF_ENABLED=False)

    with app.app_context():
        db.create_all()

    return app


def test_public_menu_falls_back_to_seed_data(monkeypatch):
    app = _build_app(monkeypatch)
    client = app.test_client()

    monkeypatch.setattr("app.routes.MenuCategory", _FakeMenuCategory)

    response = client.get("/api/menu")
    assert response.status_code == 200

    payload = response.get_json()
    assert payload[0]["name"] == "Appetizers"
    assert payload[0]["items"][0]["name"] == "Salmon Tar Tar"


def test_public_specials_falls_back_to_seed_data(monkeypatch):
    app = _build_app(monkeypatch)
    client = app.test_client()

    monkeypatch.setattr("app.routes.DailySpecialSection", _FakeDailySpecialSection)

    response = client.get("/api/specials")
    assert response.status_code == 200

    payload = response.get_json()
    assert payload[0]["course"] == "Appetizers"
    assert payload[0]["items"][0]["name"] == "French Onion Soup"
