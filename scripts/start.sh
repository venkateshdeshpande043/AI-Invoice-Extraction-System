#!/bin/bash
# =============================================================================
# Invoice Extractor — Resilient Startup Script
# Starts all three services independently so a crash in one does not kill others.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="${PROJECT_DIR}/.pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
  log_info "Shutting down all services..."
  if [ -f "$SCRIPT_DIR/stop.sh" ]; then
    bash "$SCRIPT_DIR/stop.sh"
  fi
}
trap cleanup EXIT INT TERM

# Create PID directory
mkdir -p "$PID_DIR"

# ---------------------------------------------------------------------------
# Kill any leftover processes from previous runs
# ---------------------------------------------------------------------------
if [ -f "${PID_DIR}/ocr.pid" ]; then
  OLD_PID=$(cat "${PID_DIR}/ocr.pid" 2>/dev/null || echo "")
  [ -n "$OLD_PID" ] && kill "$OLD_PID" 2>/dev/null && log_info "Killed leftover OCR process ($OLD_PID)"
  rm -f "${PID_DIR}/ocr.pid"
fi
if [ -f "${PID_DIR}/server.pid" ]; then
  OLD_PID=$(cat "${PID_DIR}/server.pid" 2>/dev/null || echo "")
  [ -n "$OLD_PID" ] && kill "$OLD_PID" 2>/dev/null && log_info "Killed leftover server process ($OLD_PID)"
  rm -f "${PID_DIR}/server.pid"
fi
if [ -f "${PID_DIR}/client.pid" ]; then
  OLD_PID=$(cat "${PID_DIR}/client.pid" 2>/dev/null || echo "")
  [ -n "$OLD_PID" ] && kill "$OLD_PID" 2>/dev/null && log_info "Killed leftover client process ($OLD_PID)"
  rm -f "${PID_DIR}/client.pid"
fi

# Kill any processes still occupying our ports
for PORT in 8765 5000 5173; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null || true
    sleep 0.5
    log_info "Freed port $PORT (was PID $PID)"
  fi
done

sleep 1

echo ""
log_info "========================================"
log_info " Invoice Extractor — Starting Services"
log_info "========================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Start PaddleOCR Service (port 8765)
# ---------------------------------------------------------------------------
log_info "Starting PaddleOCR service..."
cd "$PROJECT_DIR/ocr-service"
nohup python3 main.py > /tmp/ocr-service.log 2>&1 &
OCR_PID=$!
echo "$OCR_PID" > "${PID_DIR}/ocr.pid"
log_info "  PID: $OCR_PID | Port: 8765 | Log: /tmp/ocr-service.log"

# Wait for OCR to be ready (with timeout)
OCR_READY=false
for i in $(seq 1 30); do
  if curl -s --max-time 2 http://localhost:8765/health > /dev/null 2>&1; then
    OCR_READY=true
    log_ok "PaddleOCR ready (${i}s)"
    break
  fi
  sleep 1
done

if [ "$OCR_READY" != "true" ]; then
  log_warn "PaddleOCR not yet responding — continuing startup (may need model download)"
  log_warn "  Check /tmp/ocr-service.log for progress"
fi

# ---------------------------------------------------------------------------
# 2. Start Express Backend (port 5000)
# ---------------------------------------------------------------------------
log_info "Starting Express backend..."
cd "$PROJECT_DIR/server"
nohup node server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "${PID_DIR}/server.pid"
log_info "  PID: $SERVER_PID | Port: 5000 | Log: /tmp/server.log"

SERVER_READY=false
for i in $(seq 1 15); do
  if curl -s --max-time 2 http://localhost:5000/api/health > /dev/null 2>&1; then
    SERVER_READY=true
    log_ok "Express backend ready (${i}s)"
    break
  fi
  sleep 1
done

if [ "$SERVER_READY" != "true" ]; then
  log_error "Express backend failed to start. Check /tmp/server.log"
  tail -20 /tmp/server.log
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Start Vite Frontend (port 5173)
# ---------------------------------------------------------------------------
log_info "Starting Vite frontend..."
cd "$PROJECT_DIR/client"
nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &
CLIENT_PID=$!
echo "$CLIENT_PID" > "${PID_DIR}/client.pid"
log_info "  PID: $CLIENT_PID | Port: 5173 | Log: /tmp/vite.log"

CLIENT_READY=false
for i in $(seq 1 30); do
  if curl -s --max-time 2 http://localhost:5173/ > /dev/null 2>&1; then
    CLIENT_READY=true
    log_ok "Vite frontend ready (${i}s)"
    break
  fi
  sleep 1
done

if [ "$CLIENT_READY" != "true" ]; then
  log_warn "Vite frontend may not be ready. Check /tmp/vite.log"
fi

echo ""
log_info "========================================"
log_ok  " All Services Running"
log_info "========================================"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:5000/api/health"
echo -e "  ${CYAN}OCR:${NC}       http://localhost:8765/health"
echo ""
echo -e "  ${YELLOW}Stop all:${NC}   bash scripts/stop.sh"
echo ""

# ---------------------------------------------------------------------------
# Monitor — watch all processes; if one dies, log it but keep others running
# ---------------------------------------------------------------------------
log_info "Monitoring services (press Ctrl+C to stop all)..."
echo ""

while true; do
  sleep 5
  if ! kill -0 "$OCR_PID" 2>/dev/null; then
    log_error "PaddleOCR service crashed (was PID $OCR_PID)"
    log_error "  Check /tmp/ocr-service.log for details"
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log_error "Express backend crashed (was PID $SERVER_PID)"
    log_error "  Check /tmp/server.log for details"
    tail -10 /tmp/server.log 2>/dev/null | while read -r line; do log_error "  $line"; done
    log_info "Frontend still running at http://localhost:5173"
  fi
  if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
    log_error "Vite frontend crashed (was PID $CLIENT_PID)"
    log_error "  Check /tmp/vite.log for details"
  fi
done
