#!/usr/bin/env bash
# =============================================================================
# Invoice Extractor — Start Script (detached daemons)
#
# Starts PaddleOCR, the Express API, and the Vite frontend as independent,
# fully detached background daemons. Each daemon runs in its own session, so it
# keeps running even after this script (or the terminal/session) exits.
#
#   - If one service crashes, the others keep running.
#   - Restart any or all services by simply running this script again
#     (stale processes on the service ports are stopped first).
#   - Stop everything with:  bash scripts/stop.sh   (or `npm run stop`)
#   - Logs: /tmp/ocr.log, /tmp/server.log, /tmp/vite.log
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="${PROJECT_DIR}/.pids"
mkdir -p "$PID_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Free our ports so a stale process can never block a restart.
# ---------------------------------------------------------------------------
for PORT in 8765 5000 5173; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    log_warn "Port $PORT already in use (PID $PID) — stopping it first"
    kill "$PID" 2>/dev/null || true
    sleep 0.5
    kill -9 "$PID" 2>/dev/null || true
  fi
done
sleep 1

echo ""
log_info "============================================"
log_info " Invoice Extractor — Starting Services"
log_info "============================================"
echo ""

# start_daemon <logfile> <cwd> <command...>
# Launches the command detached (setsid = new session, immune to parent
# process-group kills). The real daemon PID is discovered later via the port it
# listens on, because setsid may fork and `$!` would record the short-lived
# parent.
start_daemon() {
  local logfile="$1" cwd="$2"
  shift 2
  (cd "$cwd" && setsid nohup "$@" >>"$logfile" 2>&1 &)
  log_info "  Launched: $*  | log: $logfile"
}

# record_pid <pidfile> <port> — writes the real listening PID once the service
# is up. This is what `stop.sh` uses to shut the daemon down.
record_pid() {
  local pidfile="$1" port="$2" pid i
  for i in $(seq 1 15); do
    pid=$(lsof -ti :"$port" 2>/dev/null | head -1 || true)
    if [ -n "$pid" ]; then
      echo "$pid" >"$pidfile"
      log_info "  PID recorded: $pid (port $port)"
      return 0
    fi
    sleep 1
  done
  log_warn "Could not determine PID for port $port"
  return 1
}

# wait_ready <name> <timeout_sec> <health_url> — returns 0 when the service
# responds; any HTTP response counts (a 503 health check still proves the
# server is listening).
wait_ready() {
  local name="$1" timeout="$2" url="$3" i
  for i in $(seq 1 "$timeout"); do
    if curl -s --max-time 2 -o /dev/null "$url"; then
      log_ok "$name ready (${i}s)"
      return 0
    fi
    sleep 1
  done
  log_err "$name did not respond at $url within ${timeout}s — see its log for details"
  return 1
}

start_daemon /tmp/ocr.log "$PROJECT_DIR/ocr-service" python3 main.py
wait_ready "PaddleOCR (:8765)" 30 http://localhost:8765/health || true
record_pid "$PID_DIR/ocr.pid" 8765 || true

start_daemon /tmp/server.log "$PROJECT_DIR/server" node server.js
wait_ready "Express API (:5000)" 20 http://localhost:5000/api/health || true
record_pid "$PID_DIR/server.pid" 5000 || true

start_daemon /tmp/vite.log "$PROJECT_DIR/client" npx vite --host 0.0.0.0 --port 5173
wait_ready "Vite frontend (:5173)" 30 http://localhost:5173/ || true
record_pid "$PID_DIR/client.pid" 5173 || true

echo ""
log_info "============================================"
log_ok  " All services started as detached daemons"
log_info "============================================"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:5000/api/health"
echo -e "  ${CYAN}OCR:${NC}       http://localhost:8765/health"
echo ""
echo -e "  ${YELLOW}Stop all:${NC}   bash scripts/stop.sh"
echo -e "  ${YELLOW}Restart:${NC}    run this script again (stale processes are stopped first)"
echo ""
