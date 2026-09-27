# Initial list of orders (each is a string: customer name and item)
orders = [
    "Alice - Pizza",
    "Bob - Burger",
    "Alice - Salad",
    "David - Pizza",
    "Eve - Pasta"
]

print(orders)

# a) Add a new order
orders.append("Frank - Noodles")

# b) Remove an incorrect order
orders.remove("Alice - Salad")

# c) Find all orders for "Pizza"
pizza_orders = [order for order in orders if "Pizza" in order]

# d) Print updated orders
print("Updated Orders:", orders)
print("Pizza Orders:", pizza_orders)


# Dictionary to store favorite food per customer
favorites = {
    "Alice": "Salad",
    "Bob": "Burger",
    "Eve": "Pasta"
}

# a) Add a new favorite
favorites["Frank"] = "Noodles"

# b) Update Bob's favorite
favorites["Bob"] = "Pizza"

# c) Print all customer favorites
for customer, food in favorites.items():
    print(f"{customer}'s favorite is {food}")


# Tuples to represent delivery coordinates (latitude, longitude)
delivery_locations = {
    "Alice": (22.5726, 88.3639),  # Kolkata
    "Bob": (19.0760, 72.8777),    # Mumbai
    "Eve": (28.6139, 77.2090)     # Delhi
}

# a) Access Bob's location
print("Bob's location:", delivery_locations["Bob"])

# b) Iterate through all coordinates
for customer, coord in delivery_locations.items():
    print(f"{customer} lives at coordinates: {coord}")    


# Orders from above again (just dish names)
dish_orders = ["Pizza", "Burger", "Salad", "Pizza", "Pasta", "Burger", "Noodles"]

# a) Get unique dishes
unique_dishes = set(dish_orders)

# b) Add a new dish
unique_dishes.add("Sushi")

# c) Remove a dish no longer offered
unique_dishes.discard("Salad")

print("Available Unique Dishes:", unique_dishes)


print("\n--- Summary Report ---")
for customer in favorites.keys():
    fav = favorites[customer]
    loc = delivery_locations.get(customer, ("Unknown", "Unknown"))
    print(f"{customer} loves {fav} and lives at {loc}")