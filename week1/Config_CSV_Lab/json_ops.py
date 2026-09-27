import json  # json is a built-in Python module for handling JSON files

# Define a configuration dictionary that might simulate settings for an app or system
config_data = {
    "app_name": "InventoryApp",
    "version": "1.0",
    "features": ["add", "update", "delete", "export"],
    "database": {
        "type": "sqlite",
        "path": "/data/db.sqlite3"
    }
}

# Save the configuration dictionary to a JSON file
with open("config.json", "w") as json_file:
    # json.dump() writes the dictionary into the file as JSON formatted string
    json.dump(config_data, json_file, indent=4)  # indent=4 makes it pretty printed

print("config.json written successfully.")


# Open the file and read its contents back into a Python dictionary
with open("config.json", "r") as json_file:
    loaded_config = json.load(json_file)  # json.load() parses JSON into Python dict

# Display the loaded configuration
print("Loaded Config:", loaded_config)

# Accessing specific values from the loaded dictionary
print("Database path:", loaded_config["database"]["path"])