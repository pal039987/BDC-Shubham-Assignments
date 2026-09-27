# Simulated product/order database — acts as our mock backend API

ORDERS_DB = {
    "ORD1001": {
        "customer": "Alice",
        "product": "Wireless Headphones",
        "order_date": "2026-09-10",
        "delivery_date": "2026-09-15",
        "status": "Delivered",
        "return_window_days": 15,
        "replacement_requested": False
    },
    "ORD1002": {
        "customer": "Bob",
        "product": "Running Shoes",
        "order_date": "2026-08-01",
        "delivery_date": "2026-08-05",
        "status": "Delivered",
        "return_window_days": 15,
        "replacement_requested": True
    },
    "ORD1003": {
        "customer": "Eve",
        "product": "Blender",
        "order_date": "2026-09-20",
        "delivery_date": "2026-09-22",
        "status": "Refund Initiated",
        "return_window_days": 15,
        "replacement_requested": False
    }
}


def get_order(order_id: str):
    """Fetch order details from the mock database."""
    return ORDERS_DB.get(order_id.upper())