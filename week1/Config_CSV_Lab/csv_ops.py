import csv  # csv is a built-in module for handling comma-separated files

# Define some inventory items as a list of dictionaries
inventory_items = [
    {"item_id": "A101", "name": "Pen", "quantity": 100, "price": 5.0},
    {"item_id": "A102", "name": "Notebook", "quantity": 50, "price": 25.0},
    {"item_id": "A103", "name": "Eraser", "quantity": 200, "price": 3.0},
]

# Define the CSV column headers
fieldnames = ["item_id", "name", "quantity", "price"]

# Write the inventory list to a CSV file
with open("inventory.csv", "w", newline="") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)  # Use DictWriter to write dict rows
    writer.writeheader()  # Writes the header row
    writer.writerows(inventory_items)  # Writes all rows from the list

print("inventory.csv written successfully.")


# Read data from the inventory CSV file
with open("inventory.csv", "r") as csvfile:
    reader = csv.DictReader(csvfile)  # DictReader reads rows into dictionaries
    loaded_inventory = list(reader)  # Convert the reader object into a list

# Display the loaded inventory
print("Loaded Inventory:", loaded_inventory)

# Example: Print only the names of the items
print("Item Names:")
for item in loaded_inventory:
    print("-", item["name"])