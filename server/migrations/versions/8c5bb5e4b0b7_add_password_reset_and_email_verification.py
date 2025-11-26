"""Add password reset + email verification flows.

Revision ID: 8c5bb5e4b0b7
Revises: 7c8f7a1be02a
Create Date: 2025-02-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8c5bb5e4b0b7"
down_revision = "7c8f7a1be02a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("client_accounts", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.add_column("client_accounts", sa.Column("last_password_change_at", sa.DateTime(), nullable=True))

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("client_account_id", sa.Integer(), sa.ForeignKey("client_accounts.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False, server_default="verify_email"),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_email_verification_tokens_client_account_id",
        "email_verification_tokens",
        ["client_account_id"],
    )
    op.create_index(
        "ix_email_verification_tokens_email",
        "email_verification_tokens",
        ["email"],
    )

    op.create_table(
        "password_reset_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("client_account_id", sa.Integer(), sa.ForeignKey("client_accounts.id"), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("requested_ip", sa.String(length=45), nullable=True),
        sa.Column("requested_user_agent", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_password_reset_requests_client_account_id",
        "password_reset_requests",
        ["client_account_id"],
    )


def downgrade():
    op.drop_index("ix_password_reset_requests_client_account_id", table_name="password_reset_requests")
    op.drop_table("password_reset_requests")
    op.drop_index("ix_email_verification_tokens_email", table_name="email_verification_tokens")
    op.drop_index("ix_email_verification_tokens_client_account_id", table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_column("client_accounts", "last_password_change_at")
    op.drop_column("client_accounts", "email_verified_at")
