"""Add minimum booking duration to working hours."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2ce42a5d5bf"
down_revision = "f7c1ceb75a2d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "studio_working_hours",
        sa.Column(
            "minimum_duration_minutes",
            sa.Integer(),
            nullable=False,
            server_default="60",
        ),
    )
    op.alter_column("studio_working_hours", "minimum_duration_minutes", server_default=None)


def downgrade() -> None:
    op.drop_column("studio_working_hours", "minimum_duration_minutes")
