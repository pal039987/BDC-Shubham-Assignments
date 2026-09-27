# Import the Inventory class from the inventory module (inventory.py)
from inventory import Inventory

# Create an instance of Inventory
inv = Inventory()

# Function to print the menu options
def show_menu():
    print("\n=== Inventory Management System ===")
    print("1. Add Item")
    print("2. Update Item")
    print("3. Delete Item")
    print("4. View Inventory")
    print("5. Exit")

# Main loop to simulate CLI using input()
# This keeps showing the menu until the user chooses to exit
while True:
    show_menu()
    choice = input("Enter your choice (1-5): ")

    if choice == '1':
        # Collect item details from user input
        item_id = input("Enter Item ID: ")
        name = input("Enter Item Name: ")
        quantity = int(input("Enter Quantity: "))  # Convert input string to integer
        price = float(input("Enter Price: "))      # Convert input string to float
        inv.add_item(item_id, name, quantity, price)  # Call add_item method

    elif choice == '2':
        item_id = input("Enter Item ID to update: ")
        quantity = input("Enter new Quantity (or leave blank): ")
        price = input("Enter new Price (or leave blank): ")

        # Convert to integer/float only if input is given
        quantity = int(quantity) if quantity else None
        price = float(price) if price else None
        inv.update_item(item_id, quantity, price)  # Call update_item method

    elif choice == '3':
        item_id = input("Enter Item ID to delete: ")
        inv.delete_item(item_id)  # Call delete_item method

    elif choice == '4':
        inv.list_items()  # Show all items

    elif choice == '5':
        print("Exiting... ✅")
        break  # Exit the while loop

    else:
        print("Invalid choice. Try again.")