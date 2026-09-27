from langchain.tools import tool
from mock_data import get_customer, get_outage_status


@tool
def check_network_outage(customer_id: str) -> str:
    """Check if there is a network outage in the customer's area."""
    customer = get_customer(customer_id)
    if not customer:
        return f"No customer found with ID {customer_id}."

    area = customer["area"]
    outage = get_outage_status(area)

    if outage:
        return f"Yes, there is a known network outage in {area}. Our team is working on it."
    else:
        return f"No network outage reported in {area}. The issue may be device-specific."


@tool
def get_last_bill_details(customer_id: str) -> str:
    """Retrieve the last bill amount, date, and payment status for a customer."""
    customer = get_customer(customer_id)
    if not customer:
        return f"No customer found with ID {customer_id}."

    return (
        f"Last bill for {customer['name']} ({customer['plan']}): "
        f"₹{customer['last_bill_amount']} billed on {customer['last_bill_date']}. "
        f"Payment status: {customer['payment_status']}."
    )


@tool
def run_speed_diagnostic(customer_id: str) -> str:
    """Run a mock internet speed diagnostic for the customer."""
    customer = get_customer(customer_id)
    if not customer:
        return f"No customer found with ID {customer_id}."

    speed = customer["last_speed_test_mbps"]
    if speed < 10:
        verdict = "This is significantly below expected speeds. Recommending a technician visit."
    elif speed < 30:
        verdict = "This is below average. Try restarting your router."
    else:
        verdict = "This is within normal range."

    return f"Last recorded speed for {customer['name']}: {speed} Mbps. {verdict}"