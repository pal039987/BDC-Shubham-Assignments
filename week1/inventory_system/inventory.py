# Define an Item class to store item details.
class Item:
    """Represents a single item in the inventory."""
    def __init__(self, item_id, name, quantity, price):
        # Constructor initializes the item with an ID, name, quantity, and price
        self.item_id = item_id
        self.name = name
        self.quantity = quantity
        self.price = price

    def __str__(self):
        # This method defines how the item will be printed.
        return f"[{self.item_id}] {self.name} - Qty: {self.quantity}, Price: ₹{self.price}"


# Define the Inventory class to manage a collection of items
class Inventory:
    """Inventory class using a dictionary to manage items."""
    def __init__(self):
        # Initialize an empty dictionary to hold all items using item_id as the key
        self.items = {}

    def add_item(self, item_id, name, quantity, price):
        # Check if item ID already exists in the inventory
        if item_id in self.items:
            print("Item ID already exists. Try updating instead.")
        else:
            # Add a new item object to the dictionary
            self.items[item_id] = Item(item_id, name, quantity, price)
            print("Item added successfully.")

    def update_item(self, item_id, quantity=None, price=None):
        # Check if item ID exists
        if item_id not in self.items:
            print("Item not found.")
            return
        # Update quantity and/or price only if they are provided
        if quantity is not None:
            self.items[item_id].quantity = quantity
        if price is not None:
            self.items[item_id].price = price
        print("Item updated successfully.")

    def delete_item(self, item_id):
        # Remove item from the dictionary if it exists
        if item_id in self.items:
            del self.items[item_id]
            print("Item deleted.")
        else:
            print("Item not found.")

    def list_items(self):
        # Print all items in the inventory
        if not self.items:
            print("Inventory is empty.")
        else:
            for item in self.items.values():
                print(item)