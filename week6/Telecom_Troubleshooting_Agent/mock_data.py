# Simulated telecom customer database — acts as our mock backend API

CUSTOMERS_DB = {
    "CUST501": {
        "name": "Alice",
        "area": "Mumbai-Andheri",
        "plan": "Postpaid Unlimited",
        "last_bill_amount": 799.0,
        "last_bill_date": "2026-09-01",
        "payment_status": "Paid",
        "last_speed_test_mbps": 45.2
    },
    "CUST502": {
        "name": "Bob",
        "area": "Delhi-Rohini",
        "plan": "Prepaid 2GB/day",
        "last_bill_amount": 299.0,
        "last_bill_date": "2026-08-15",
        "payment_status": "Unpaid",
        "last_speed_test_mbps": 8.5
    },
    "CUST503": {
        "name": "Eve",
        "area": "Bangalore-Koramangala",
        "plan": "Postpaid 100GB",
        "last_bill_amount": 999.0,
        "last_bill_date": "2026-09-10",
        "payment_status": "Paid",
        "last_speed_test_mbps": 62.0
    }
}

# Simulated network outage status per area
OUTAGE_DB = {
    "Mumbai-Andheri": False,
    "Delhi-Rohini": True,
    "Bangalore-Koramangala": False
}


def get_customer(customer_id: str):
    """Fetch customer details from the mock database."""
    return CUSTOMERS_DB.get(customer_id.upper())


def get_outage_status(area: str):
    """Check if there is a network outage in the given area."""
    return OUTAGE_DB.get(area)