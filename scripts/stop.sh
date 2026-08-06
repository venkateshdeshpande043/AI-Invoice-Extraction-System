#!/bin/bash
# =============================================================================
# Invoice Extractor — Stop Script
# Gracefully stops all running services.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="${PROJECT_DIR}/.pids"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

echo ""
log_info "Stopping Invoice Extractor services..."

# Stop services in reverse order: client → server → OCR
STOP_ORDER="client server ocr"

for SERVICE in $STOP_ORDER; do
  PID_FILE="${PID_DIR}/${SERVICE}.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
      log_info "Stopping $SERVICE (PID $PID)..."
      kill "$PID" 2>/dev/null || true
      # Wait for graceful shutdown
      for i in $(seq 1 5); do
        if ! kill -0 "$PID" 2>/dev/null; then
          break
        fi
        sleep 0.5
      done
      # Force kill if still alive
      if kill -0 "$PID" 2>/dev/null; then
        log_warn "Force killing $SERVICE (PID $PID)..."
        kill -9 "$PID" 2>/dev/null || true
      fi
      log_ok "$SERVICE stopped"
    else
      log_warn "$SERVICE was not running (PID $PID not found)"
    fi
    rm -f "$PID_FILE"
  fi
done

# Also clean up any orphaned processes on our ports
for PORT in 8765 5000 5173; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    log_info "Cleaning up orphan on port $PORT (PID $PID)..."
    kill "$PID" 2>/dev/null || true
    sleep 0.3
    kill -9 "$PID" 2>/dev/null || true
  fi
done

# Remove PID directory if empty
rmdir "$PID_DIR" 2>/dev/null || true

echo ""
log_ok "All services stopped."
echo ""
