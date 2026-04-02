#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

export PORT="${PORT:-3000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5173}"
export DATA_DIR="${DATA_DIR:-$ROOT/data}"

echo "Starting backend on port $PORT..."
cd "$ROOT/backend" && node --watch server.js
