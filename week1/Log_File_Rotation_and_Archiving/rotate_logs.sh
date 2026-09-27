#!/bin/bash

# Set variables
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/app.log"
ARCHIVE_DIR="$LOG_DIR/archive"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Create archive directory if not exists
mkdir -p "$ARCHIVE_DIR"

# Set max log size in bytes (1 KB = 1024 bytes for testing)
MAX_SIZE=1024

# Get actual file size
FILE_SIZE=$(stat -c%s "$LOG_FILE")

# Rotate if size exceeds threshold
if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
    echo "Rotating log: $LOG_FILE is $FILE_SIZE bytes (> $MAX_SIZE bytes)"

    # Move log to archive with timestamp
    mv "$LOG_FILE" "$ARCHIVE_DIR/app_$DATE.log"

    # Create a new empty log file
    touch "$LOG_FILE"
else
    echo "No rotation needed. Log file size: $FILE_SIZE bytes"
fi