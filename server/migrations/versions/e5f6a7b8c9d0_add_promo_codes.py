"""Add promo_codes and promo_code_events tables

Revision ID: e5f6a7b8c9d0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-11

Influencer promo codes managed from the admin "QR & Promo Codes" page, with
aggregate counters on promo_codes and a per-interaction log in
promo_code_events (link/QR visits and staff-logged redemptions).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'promo_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=40), nullable=False),
        sa.Column('influencer_name', sa.String(length=160), nullable=False),
        sa.Column('influencer_handle', sa.String(length=120), nullable=True),
        sa.Column('platform', sa.String(length=60), nullable=True),
        sa.Column('discount_label', sa.String(length=160), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('starts_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('max_redemptions', sa.Integer(), nullable=True),
        sa.Column('visit_count', sa.Integer(), nullable=False),
        sa.Column('redemption_count', sa.Integer(), nullable=False),
        sa.Column('last_visit_at', sa.DateTime(), nullable=True),
        sa.Column('last_redemption_at', sa.DateTime(), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_admin_id'], ['admin_accounts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_table(
        'promo_code_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('promo_code_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=20), nullable=False),
        sa.Column('source', sa.String(length=40), nullable=True),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_admin_id'], ['admin_accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['promo_code_id'], ['promo_codes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_promo_code_events_promo_code_id', 'promo_code_events', ['promo_code_id'])
    op.create_index('ix_promo_code_events_created_at', 'promo_code_events', ['created_at'])


def downgrade():
    op.drop_index('ix_promo_code_events_created_at', table_name='promo_code_events')
    op.drop_index('ix_promo_code_events_promo_code_id', table_name='promo_code_events')
    op.drop_table('promo_code_events')
    op.drop_table('promo_codes')
