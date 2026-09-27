from tools import check_network_outage, get_last_bill_details, run_speed_diagnostic

print(check_network_outage.invoke("CUST502"))
print(get_last_bill_details.invoke("CUST501"))
print(run_speed_diagnostic.invoke("CUST502"))