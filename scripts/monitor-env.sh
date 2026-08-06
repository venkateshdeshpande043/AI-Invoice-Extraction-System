#!/usr/bin/env bash
# =============================================================================
# Invoice Extractor — Environment Monitor v2 (root-cause instrumentation)
#
# Samples every 10 seconds. v2 adds kernel boot-time (btime) tracking: if
# btime changes between ticks, the CONTAINER was restarted — definitive proof,
# independent of /proc/uptime.
#
# Usage:
#   setsid nohup bash scripts/monitor-env.sh >/dev/null 2>&1 &
#   tail -f /tmp/env-monitor.log
# =============================================================================

LOG=/tmp/env-monitor.log
PID_DIR="/home/daytona/codebase/.pids"
PREVIEW_BASE="https://5173-${DAYTONA_SANDBOX_ID:-unknown}.daytonaproxy01.net"

stamp() { date '+%Y-%m-%d %H:%M:%S'; }
alive() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null && echo alive || echo dead; }
btime() { awk '/^btime/{print $2}' /proc/stat 2>/dev/null || echo '?'; }

echo "=== MONITOR v2 START $(stamp) monitor_pid=$$ sandbox_id=${DAYTONA_SANDBOX_ID:-unknown} btime=$(btime) ===" > "$LOG"

PREV_BTIME="$(btime)"
TICK=0
while true; do
  TICK=$((TICK + 1))

  NOW_BTIME="$(btime)"
  if [ -n "$PREV_BTIME" ] && [ "$NOW_BTIME" != "$PREV_BTIME" ]; then
    echo "!!! CONTAINER RESTART DETECTED $(stamp) btime ${PREV_BTIME} -> ${NOW_BTIME}" >> "$LOG"
  fi
  PREV_BTIME="$NOW_BTIME"

  UPTIME=$(awk '{printf "%.0f", $1}' /proc/uptime 2>/dev/null || echo '?')
  MEM_AVAIL=$(awk '/MemAvailable/{printf "%.0f MB", $2/1024}' /proc/meminfo 2>/dev/null || echo '?')
  MEM_TOTAL=$(awk '/MemTotal/{printf "%.0f MB", $2/1024}' /proc/meminfo 2>/dev/null || echo '?')

  CPID=$(cat "$PID_DIR/client.pid" 2>/dev/null || echo '-')
  SPID=$(cat "$PID_DIR/server.pid" 2>/dev/null || echo '-')
  OPID=$(cat "$PID_DIR/ocr.pid" 2>/dev/null || echo '-')
  CPORT=$(lsof -ti :5173 2>/dev/null | head -1 || echo '-')
  SPORT=$(lsof -ti :5000 2>/dev/null | head -1 || echo '-')
  OPORT=$(lsof -ti :8765 2>/dev/null | head -1 || echo '-')

  HEALTH=$(curl -s --max-time 3 http://localhost:5000/api/health 2>/dev/null | tr -d '\n' || echo 'CURL_FAIL')
  PREVIEW=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "$PREVIEW_BASE/" 2>/dev/null || echo 'CURL_FAIL')
  OCR_HEALTH=$(curl -s --max-time 3 http://localhost:8765/health 2>/dev/null | tr -d '\n' || echo 'CURL_FAIL')

  VLOG=$(tail -1 /tmp/vite.log 2>/dev/null | cut -c1-120 || echo '-')
  SLOG=$(tail -1 /tmp/server.log 2>/dev/null | cut -c1-120 || echo '-')
  OLOG=$(tail -1 /tmp/ocr.log 2>/dev/null | cut -c1-120 || echo '-')

  printf '%s tick=%d btime=%s uptime=%ss mem_avail=%s/%s | vite pid=%s alive=%s port=%s | express pid=%s alive=%s port=%s | ocr pid=%s alive=%s port=%s | health=%s | ocr_health=%s | preview=%s | vlog[%s] slog[%s] olog[%s]\n' \
    "$(stamp)" "$TICK" "$NOW_BTIME" "$UPTIME" "$MEM_AVAIL" "$MEM_TOTAL" \
    "$CPID" "$(alive "$CPID")" "$CPORT" \
    "$SPID" "$(alive "$SPID")" "$SPORT" \
    "$OPID" "$(alive "$OPID")" "$OPORT" \
    "$HEALTH" "$OCR_HEALTH" "$PREVIEW" \
    "$VLOG" "$SLOG" "$OLOG" >> "$LOG"

  sleep 10
done
