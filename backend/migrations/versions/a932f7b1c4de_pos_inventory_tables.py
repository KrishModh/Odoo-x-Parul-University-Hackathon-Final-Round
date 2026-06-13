"""pos inventory tables

Revision ID: a932f7b1c4de
Revises: 33bdc1ef7747
Create Date: 2026-06-13 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a932f7b1c4de'
down_revision = '33bdc1ef7747'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=80), nullable=False),
        sa.Column('slug', sa.String(length=90), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)

    op.create_table('tables',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=60), nullable=False),
        sa.Column('seats', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    op.create_table('products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=140), nullable=False),
        sa.Column('image_url', sa.String(length=600), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('stock_status', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)

    op.create_table('orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=32), nullable=False),
        sa.Column('table_id', sa.Integer(), nullable=True),
        sa.Column('cashier_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('CART', 'SENT_TO_KITCHEN', 'CANCELLED', name='order_status'), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('gst', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['cashier_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['table_id'], ['tables.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_cashier_id'), 'orders', ['cashier_id'], unique=False)
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)
    op.create_index(op.f('ix_orders_table_id'), 'orders', ['table_id'], unique=False)

    op.create_table('order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('product_name', sa.String(length=140), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('line_total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_order_items_product_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_table('order_items')
    op.drop_index(op.f('ix_orders_table_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_index(op.f('ix_orders_cashier_id'), table_name='orders')
    op.drop_table('orders')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_category_id'), table_name='products')
    op.drop_table('products')
    op.drop_table('tables')
    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_table('categories')
