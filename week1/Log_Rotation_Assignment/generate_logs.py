import os
from datetime import datetime, timedelta
import random

LOG_DIR = "./app_logs"
APP_LOG_FILE = os.path.join(LOG_DIR, "app.log")
ERROR_LOG_FILE = os.path.join(LOG_DIR, "error.log")


def create_dummy_log_entry(log_type):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user = random.choice(["user1", "user2", "admin", "guest"])
    messages = {
        "app": [
            "User {} logged in.".format(user),
            "Processed request for {}.".format(random.choice(["/dashboard", "/api/data", "/settings"])),
            "Application heartbeat: OK.",
            "Data record #{} updated.".format(random.randint(1000, 9999)),
        ],
        "error": [
            "[ERROR] Failed to connect to database for user {}.".format(user),
            "[WARNING] High memory usage detected.",
            "[CRITICAL] Unhandled exception in module {}.py".format(random.choice(["auth", "data_processor"])),
            "[ERROR] API endpoint '/api/data' returned 500 for user {}.".format(user),
        ]
    }
    return f"{timestamp} - {random.choice(messages[log_type])}"


def generate_dummy_logs(num_entries_app=50, num_entries_error=10):
    os.makedirs(LOG_DIR, exist_ok=True)

    print(f"Generating {num_entries_app} app log entries to {APP_LOG_FILE}")
    with open(APP_LOG_FILE, "w") as f:  # Overwrite for fresh test
        for _ in range(num_entries_app):
            f.write(create_dummy_log_entry("app") + "\n")

    print(f"Generating {num_entries_error} error log entries to {ERROR_LOG_FILE}")
    with open(ERROR_LOG_FILE, "w") as f:  # Overwrite for fresh test
        for _ in range(num_entries_error):
            f.write(create_dummy_log_entry("error") + "\n")

    print("Dummy log files created.")


if __name__ == "__main__":
    # Run this to create your dummy log files
    generate_dummy_logs()

    # Verify creation
    print(f"\nContent of {APP_LOG_FILE} (first 3 lines):")
    if os.path.exists(APP_LOG_FILE):
        with open(APP_LOG_FILE, 'r') as f:
            for i, line in enumerate(f):
                print(line.strip())
                if i >= 2:
                    break
    else:
        print("File not found.")