"""Add user roles and verification state.

Revision ID: 0002_add_user_roles
Revises: 0001_initial
Create Date: 2026-06-30 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_add_user_roles"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), server_default="USER", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.execute("UPDATE users SET role = 'SUPER_ADMIN' WHERE is_superuser IS TRUE")
    op.create_check_constraint(
        op.f("ck_users_user_role"),
        "users",
        "role IN ('ADMIN', 'USER', 'SUPER_ADMIN')",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_users_user_role"), "users", type_="check")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "role")
