#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

export PORT="${PORT:-3000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5173}"
export DATA_DIR="${DATA_DIR:-$ROOT/data}"

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting backend on port $PORT..."
cd "$ROOT/backend" && node --watch server.js &
BACKEND_PID=$!

echo "Starting frontend on port 5173..."
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

wait
