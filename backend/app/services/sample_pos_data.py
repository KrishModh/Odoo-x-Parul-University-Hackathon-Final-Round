from decimal import Decimal

SAMPLE_CATEGORIES = [
    {'id': 1, 'name': 'Coffee', 'slug': 'coffee', 'display_order': 1},
    {'id': 2, 'name': 'Meals', 'slug': 'meals', 'display_order': 2},
    {'id': 3, 'name': 'Snacks', 'slug': 'snacks', 'display_order': 3},
    {'id': 4, 'name': 'Dessert', 'slug': 'dessert', 'display_order': 4},
]

SAMPLE_TABLES = [{'id': index, 'name': f'T{index}', 'seats': 4, 'status': 'available'} for index in range(1, 7)]

SAMPLE_PRODUCTS = [
    {
        'id': 1,
        'name': 'Cappuccino',
        'price': 180.0,
        'category': 'coffee',
        'category_name': 'Coffee',
        'stock_status': 'in_stock',
        'quantity': 30,
        'description': 'Velvety espresso with steamed milk and foam.',
        'image_url': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 2,
        'name': 'Espresso',
        'price': 120.0,
        'category': 'coffee',
        'category_name': 'Coffee',
        'stock_status': 'in_stock',
        'quantity': 40,
        'description': 'Short, rich, and aromatic cafe classic.',
        'image_url': 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 3,
        'name': 'Burger',
        'price': 220.0,
        'category': 'meals',
        'category_name': 'Meals',
        'stock_status': 'low_stock',
        'quantity': 5,
        'description': 'Toasted bun, crisp vegetables, and cafe sauce.',
        'image_url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 4,
        'name': 'Veg Pizza',
        'price': 280.0,
        'category': 'meals',
        'category_name': 'Meals',
        'stock_status': 'in_stock',
        'quantity': 22,
        'description': 'Stone-style cafe pizza with bubbling cheese.',
        'image_url': 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 5,
        'name': 'Pasta',
        'price': 240.0,
        'category': 'meals',
        'category_name': 'Meals',
        'stock_status': 'in_stock',
        'quantity': 18,
        'description': 'Creamy pasta finished with herbs.',
        'image_url': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 6,
        'name': 'Fries',
        'price': 120.0,
        'category': 'snacks',
        'category_name': 'Snacks',
        'stock_status': 'in_stock',
        'quantity': 35,
        'description': 'Golden fries with sea salt.',
        'image_url': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 7,
        'name': 'Sandwich',
        'price': 160.0,
        'category': 'snacks',
        'category_name': 'Snacks',
        'stock_status': 'in_stock',
        'quantity': 24,
        'description': 'Grilled sandwich with fresh fillings.',
        'image_url': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    },
    {
        'id': 8,
        'name': 'Brownie',
        'price': 150.0,
        'category': 'dessert',
        'category_name': 'Dessert',
        'stock_status': 'in_stock',
        'quantity': 16,
        'description': 'Dense chocolate brownie with a glossy crumb.',
        'image_url': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    },
]


def calculate_totals(items):
    subtotal = sum(Decimal(str(item['price'])) * int(item['quantity']) for item in items)
    gst = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))
    total = subtotal + gst
    return subtotal.quantize(Decimal('0.01')), gst, total.quantize(Decimal('0.01'))
