"""add user verification fields

Revision ID: c0f5f55f7a3d
Revises: 644d1b44bdfd
Create Date: 2026-06-13 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c0f5f55f7a3d'
down_revision = '644d1b44bdfd'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('otp_code', sa.String(length=6), nullable=True))
        batch_op.add_column(sa.Column('otp_expiry', sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE users SET is_verified = true WHERE role IN ('ADMIN', 'KITCHEN')")


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('otp_expiry')
        batch_op.drop_column('otp_code')
        batch_op.drop_column('is_verified')
