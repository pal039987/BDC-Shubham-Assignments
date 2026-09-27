from tools import check_return_eligibility, check_replacement_status, calculate_refund_date

print(check_return_eligibility.invoke("ORD1001"))
print(check_replacement_status.invoke("ORD1002"))
print(calculate_refund_date.invoke("ORD1003"))