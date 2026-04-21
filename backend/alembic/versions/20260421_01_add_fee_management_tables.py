"""add fee management tables

Revision ID: 20260421_01
Revises:
Create Date: 2026-04-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260421_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fee_structures",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("term", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_fee_structures_grade"), "fee_structures", ["grade"], unique=False)
    op.create_index(op.f("ix_fee_structures_id"), "fee_structures", ["id"], unique=False)
    op.create_index(op.f("ix_fee_structures_term"), "fee_structures", ["term"], unique=False)
    op.create_index(op.f("ix_fee_structures_year"), "fee_structures", ["year"], unique=False)

    op.create_table(
        "student_fees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("fee_structure_id", sa.Integer(), nullable=False),
        sa.Column("amount_owed", sa.Integer(), nullable=False),
        sa.Column("amount_paid", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["fee_structure_id"], ["fee_structures.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_student_fees_fee_structure_id"), "student_fees", ["fee_structure_id"], unique=False)
    op.create_index(op.f("ix_student_fees_id"), "student_fees", ["id"], unique=False)
    op.create_index(op.f("ix_student_fees_student_id"), "student_fees", ["student_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_fee_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("payment_method", sa.String(length=30), nullable=False),
        sa.Column("receipt_number", sa.String(length=20), nullable=False),
        sa.Column("mpesa_code", sa.String(length=40), nullable=True),
        sa.Column("transaction_reference", sa.String(length=120), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["student_fee_id"], ["student_fees.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_id"), "payments", ["id"], unique=False)
    op.create_index(op.f("ix_payments_mpesa_code"), "payments", ["mpesa_code"], unique=False)
    op.create_index(op.f("ix_payments_receipt_number"), "payments", ["receipt_number"], unique=True)
    op.create_index(op.f("ix_payments_student_fee_id"), "payments", ["student_fee_id"], unique=False)
    op.create_index(op.f("ix_payments_student_id"), "payments", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_student_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_student_fee_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_receipt_number"), table_name="payments")
    op.drop_index(op.f("ix_payments_mpesa_code"), table_name="payments")
    op.drop_index(op.f("ix_payments_id"), table_name="payments")
    op.drop_table("payments")

    op.drop_index(op.f("ix_student_fees_student_id"), table_name="student_fees")
    op.drop_index(op.f("ix_student_fees_id"), table_name="student_fees")
    op.drop_index(op.f("ix_student_fees_fee_structure_id"), table_name="student_fees")
    op.drop_table("student_fees")

    op.drop_index(op.f("ix_fee_structures_year"), table_name="fee_structures")
    op.drop_index(op.f("ix_fee_structures_term"), table_name="fee_structures")
    op.drop_index(op.f("ix_fee_structures_id"), table_name="fee_structures")
    op.drop_index(op.f("ix_fee_structures_grade"), table_name="fee_structures")
    op.drop_table("fee_structures")
