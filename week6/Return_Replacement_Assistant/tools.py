from langchain.tools import tool
from datetime import datetime, timedelta
from mock_data import get_order


@tool
def check_return_eligibility(order_id: str) -> str:
    """Check if an order is eligible for return based on delivery date and return window."""
    order = get_order(order_id)
    if not order:
        return f"No order found with ID {order_id}."

    delivery_date = datetime.strptime(order["delivery_date"], "%Y-%m-%d")
    deadline = delivery_date + timedelta(days=order["return_window_days"])
    today = datetime.now()

    if today <= deadline:
        return (
            f"Order {order_id} ({order['product']}) is ELIGIBLE for return. "
            f"Return window closes on {deadline.strftime('%Y-%m-%d')}."
        )
    else:
        return (
            f"Order {order_id} ({order['product']}) is NOT eligible for return. "
            f"Return window closed on {deadline.strftime('%Y-%m-%d')}."
        )


@tool
def check_replacement_status(order_id: str) -> str:
    """Check whether a replacement has been requested/processed for an order."""
    order = get_order(order_id)
    if not order:
        return f"No order found with ID {order_id}."

    if order["replacement_requested"]:
        return f"A replacement has been requested for order {order_id} ({order['product']}). It is being processed."
    else:
        return f"No replacement has been requested yet for order {order_id} ({order['product']})."


@tool
def calculate_refund_date(order_id: str) -> str:
    """Estimate the refund completion date for a given order."""
    order = get_order(order_id)
    if not order:
        return f"No order found with ID {order_id}."

    if order["status"] != "Refund Initiated":
        return f"No refund has been initiated for order {order_id} yet."

    # Assume refunds take 7 business days from today
    refund_date = datetime.now() + timedelta(days=7)
    return f"Refund for order {order_id} ({order['product']}) is estimated to complete by {refund_date.strftime('%Y-%m-%d')}."