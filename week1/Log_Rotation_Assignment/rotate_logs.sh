#!/bin/bash

# --- Configuration Variables ---
LOG_DIR="./app_logs"                      # Directory where log files are located
ARCHIVE_DIR="./archived_logs"             # Directory to store archived logs
LOG_FILES=("app.log" "error.log")         # Array of log file names to rotate
RETENTION_DAYS=7                          # Number of days to keep archived logs
MAX_ROTATIONS=3                           # Number of old log files to keep (e.g., app.log.1, app.log.2)
DATE_FORMAT="+%Y-%m-%d_%H%M%S"            # Timestamp format for archived files

# --- Logging Function ---
log_message() {
    local type="$1"
    local message="$2"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$type] $message"
}

# --- Create necessary directories if they don't exist ---
log_message "INFO" "Ensuring log directories exist..."
mkdir -p "$LOG_DIR" || { log_message "ERROR" "Failed to create log directory: $LOG_DIR"; exit 1; }
mkdir -p "$ARCHIVE_DIR" || { log_message "ERROR" "Failed to create archive directory: $ARCHIVE_DIR"; exit 1; }

log_message "INFO" "Starting log rotation and archiving process."

# --- Rotate Log Files ---
for log_file in "${LOG_FILES[@]}"; do
    FULL_LOG_PATH="$LOG_DIR/$log_file"
    log_message "INFO" "Processing log file: $FULL_LOG_PATH"

    if [[ ! -f "$FULL_LOG_PATH" ]]; then
        log_message "WARNING" "Log file not found, skipping: $FULL_LOG_PATH"
        continue
    fi

    # Step 1: Archive the current log file with a timestamp
    TIMESTAMP=$(date "$DATE_FORMAT")
    ARCHIVED_FILENAME="${log_file}_${TIMESTAMP}.gz"
    FULL_ARCHIVE_PATH="$ARCHIVE_DIR/$ARCHIVED_FILENAME"

    log_message "INFO" "Archiving $log_file to $FULL_ARCHIVE_PATH"
    if [[ -s "$FULL_LOG_PATH" ]]; then # Check if file exists and is not empty
        gzip -c "$FULL_LOG_PATH" > "$FULL_ARCHIVE_PATH" 2>/dev/null
        if [[ $? -ne 0 ]]; then
            log_message "ERROR" "Failed to archive $log_file. Continuing to next log."
            continue
        fi
    else
        log_message "INFO" "$log_file is empty. Skipping archiving."
    fi

    # Step 2: Truncate the original log file (empties file, keeps permissions/inode)
    log_message "INFO" "Truncating $log_file"
    > "$FULL_LOG_PATH" || { log_message "ERROR" "Failed to truncate $log_file"; continue; }

    # Step 3: Shift old rotated files (.N) - delete oldest, rename rest up by 1
    for ((i=$MAX_ROTATIONS; i>=1; i--)); do
        OLD_ROTATED_FILE="$FULL_LOG_PATH.$i"
        NEW_ROTATED_FILE="$FULL_LOG_PATH.$((i+1))"
        if [[ -f "$OLD_ROTATED_FILE" ]]; then
            if [[ $i -eq $MAX_ROTATIONS ]]; then
                log_message "INFO" "Deleting old rotated file: $OLD_ROTATED_FILE"
                rm -f "$OLD_ROTATED_FILE" || log_message "WARNING" "Failed to delete $OLD_ROTATED_FILE"
            else
                log_message "INFO" "Renaming $OLD_ROTATED_FILE to $NEW_ROTATED_FILE"
                mv "$OLD_ROTATED_FILE" "$NEW_ROTATED_FILE" || log_message "ERROR" "Failed to rename $OLD_ROTATED_FILE"
            fi
        fi
    done

    # Step 4: Rename current (now-truncated) log to .1
    CURRENT_LOG_TO_ONE="$FULL_LOG_PATH.1"
    log_message "INFO" "Renaming $log_file to $CURRENT_LOG_TO_ONE"
    if [[ -f "$FULL_LOG_PATH" ]]; then
        mv "$FULL_LOG_PATH" "$CURRENT_LOG_TO_ONE" || log_message "ERROR" "Failed to rename $FULL_LOG_PATH to $CURRENT_LOG_TO_ONE"
    else
        log_message "WARNING" "Original log file $FULL_LOG_PATH not found after truncation. This might indicate an issue."
    fi

done

# --- Prune Old Archived Logs ---
log_message "INFO" "Pruning archived logs older than $RETENTION_DAYS days."
find "$ARCHIVE_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete \
    || log_message "ERROR" "Failed to prune old archived logs. Check permissions."

log_message "INFO" "Log rotation and archiving process finished."