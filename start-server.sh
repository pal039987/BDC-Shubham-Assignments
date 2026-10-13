#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/backend"
fuser -k 3001/tcp >/dev/null 2>&1 || true
setsid nohup node server.js > server.log 2>&1 < /dev/null &
echo "CryptoTrader Server started in background on port 3001 (PID: $!)"
