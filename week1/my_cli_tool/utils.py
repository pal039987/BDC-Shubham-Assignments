# Define a function for addition
def add(a, b):
    return a + b

# Define a function for subtraction
def subtract(a, b):
    return a - b

# Define a function for multiplication
def multiply(a, b):
    return a * b

# Define a function for division
def divide(a, b):
    # Prevent division by zero
    if b == 0:
        return "Cannot divide by zero"
    return a / b