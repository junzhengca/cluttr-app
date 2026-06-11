#!/usr/bin/env bash
#
# Dev harness for AI-driven development loop:
# run the Expo app on the iOS simulator (dev client), interact with it,
# and read feedback (logs, screenshots, accessibility tree).
#
# Usage: ./scripts/harness.sh <command> [args]   (see `help`)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARNESS_DIR="$ROOT_DIR/.harness"
METRO_LOG="$HARNESS_DIR/metro.log"
METRO_PID_FILE="$HARNESS_DIR/metro.pid"
SCREENSHOT_DIR="$HARNESS_DIR/screenshots"
METRO_PORT="${METRO_PORT:-8081}"
BUNDLE_ID="com.cluttrapp.cluttr"
APP_SCHEME="com.cluttrapp.cluttr"
PREFERRED_DEVICE="${HARNESS_DEVICE:-iPhone 17}"

mkdir -p "$HARNESS_DIR" "$SCREENSHOT_DIR"

# ---------- helpers ----------

info()  { printf '\033[34m[harness]\033[0m %s\n' "$*"; }
ok()    { printf '\033[32m  ✓\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m  ✗\033[0m %s\n' "$*"; }
die()   { printf '\033[31m[harness] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

booted_udid() {
  xcrun simctl list devices booted 2>/dev/null \
    | grep -Eo '\([0-9A-F-]{36}\)' | head -1 | tr -d '()'
}

require_udid() {
  local udid
  udid="$(booted_udid)"
  [ -n "$udid" ] || die "no booted simulator (run: $0 up)"
  echo "$udid"
}

metro_running() {
  curl -sf --max-time 2 "http://localhost:$METRO_PORT/status" 2>/dev/null \
    | grep -q 'packager-status:running'
}

metro_pid() {
  if [ -f "$METRO_PID_FILE" ] && kill -0 "$(cat "$METRO_PID_FILE")" 2>/dev/null; then
    cat "$METRO_PID_FILE"
  else
    lsof -ti ":$METRO_PORT" -sTCP:LISTEN 2>/dev/null | head -1 || true
  fi
}

app_installed() {
  local udid="$1"
  xcrun simctl listapps "$udid" 2>/dev/null | grep -q "$BUNDLE_ID"
}

require_axe() {
  command -v axe >/dev/null 2>&1 \
    || die "axe not installed. Install with: brew install cameroncooke/axe/axe"
}

dev_client_url() {
  echo "${APP_SCHEME}://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${METRO_PORT}"
}

# simctl openurl on a custom scheme shows an "Open in Cluttr?" dialog;
# auto-accept it so the loop needs no manual step.
open_dev_client_url() {
  local udid="$1"
  xcrun simctl openurl "$udid" "$(dev_client_url)"
  if command -v axe >/dev/null 2>&1; then
    sleep 2
    axe tap --label "Open" --udid "$udid" >/dev/null 2>&1 || true
  fi
}

# ---------- commands ----------

cmd_doctor() {
  info "doctor"
  local failures=0

  if command -v axe >/dev/null 2>&1; then
    ok "axe installed ($(axe --version 2>/dev/null | head -1 || echo 'version unknown'))"
  else
    warn "axe missing — install: brew install cameroncooke/axe/axe"
    failures=$((failures + 1))
  fi

  if xcrun simctl help >/dev/null 2>&1; then
    ok "simctl available ($(xcodebuild -version 2>/dev/null | head -1))"
  else
    warn "simctl unavailable — install Xcode"
    failures=$((failures + 1))
  fi

  local udid
  udid="$(booted_udid)"
  if [ -n "$udid" ]; then
    ok "booted simulator: $udid"
    if app_installed "$udid"; then
      ok "$BUNDLE_ID installed on simulator"
    else
      warn "$BUNDLE_ID not installed — run: $0 build"
      failures=$((failures + 1))
    fi
  else
    warn "no booted simulator — run: $0 up"
  fi

  [ -f "$ROOT_DIR/.env" ] && ok ".env present" || { warn ".env missing"; failures=$((failures + 1)); }
  [ -f "$ROOT_DIR/GoogleService-Info.plist" ] && ok "GoogleService-Info.plist present" \
    || { warn "GoogleService-Info.plist missing (Firebase init will fail)"; failures=$((failures + 1)); }

  if metro_running; then
    ok "Metro running on port $METRO_PORT"
  else
    local pid
    pid="$(lsof -ti ":$METRO_PORT" -sTCP:LISTEN 2>/dev/null | head -1 || true)"
    if [ -n "$pid" ]; then
      warn "port $METRO_PORT in use by pid $pid but not a healthy Metro"
      failures=$((failures + 1))
    else
      ok "Metro not running (port $METRO_PORT free) — run: $0 up"
    fi
  fi

  [ "$failures" -eq 0 ] && info "all checks passed" || die "$failures check(s) failed"
}

cmd_up() {
  local udid
  udid="$(booted_udid)"
  if [ -z "$udid" ]; then
    info "booting simulator: $PREFERRED_DEVICE"
    xcrun simctl boot "$PREFERRED_DEVICE" 2>/dev/null || die "could not boot '$PREFERRED_DEVICE'"
    udid="$(booted_udid)"
  fi
  open -a Simulator >/dev/null 2>&1 || true
  ok "simulator booted: $udid"

  app_installed "$udid" || die "$BUNDLE_ID not installed on simulator — run: $0 build"

  if metro_running; then
    ok "Metro already running on port $METRO_PORT"
  else
    info "starting Metro (logs: $METRO_LOG)"
    : > "$METRO_LOG"
    (cd "$ROOT_DIR" && nohup npx expo start --port "$METRO_PORT" >> "$METRO_LOG" 2>&1 &
     echo $! > "$METRO_PID_FILE")
    local i=0
    until metro_running; do
      i=$((i + 1))
      [ "$i" -gt 60 ] && die "Metro did not become healthy in 60s — check: $0 logs"
      sleep 1
    done
    ok "Metro healthy (pid $(cat "$METRO_PID_FILE"))"
  fi

  info "launching dev client into Metro"
  xcrun simctl launch "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
  sleep 2
  open_dev_client_url "$udid"
  ok "app launched — verify with: $0 screenshot"
}

cmd_down() {
  local pid
  pid="$(metro_pid)"
  if [ -n "$pid" ]; then
    # Kill the whole process group; expo start spawns children.
    kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    lsof -ti ":$METRO_PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
    ok "Metro stopped (pid $pid)"
  else
    ok "Metro not running"
  fi
  rm -f "$METRO_PID_FILE"

  if [ "${1:-}" = "--shutdown" ]; then
    local udid
    udid="$(booted_udid)"
    if [ -n "$udid" ]; then
      xcrun simctl shutdown "$udid"
      ok "simulator shut down"
    fi
  fi
}

cmd_status() {
  local udid
  udid="$(booted_udid)"
  if [ -n "$udid" ]; then
    ok "simulator booted: $udid"
    app_installed "$udid" && ok "$BUNDLE_ID installed" || warn "$BUNDLE_ID not installed"
  else
    warn "no booted simulator"
  fi
  if metro_running; then
    ok "Metro running on port $METRO_PORT (pid $(metro_pid))"
  else
    warn "Metro not running"
  fi
  if [ -s "$METRO_LOG" ]; then
    info "last 5 log lines:"
    tail -5 "$METRO_LOG"
  fi
}

cmd_logs() {
  [ -f "$METRO_LOG" ] || die "no log file yet — run: $0 up"
  case "${1:-}" in
    -f) tail -f "$METRO_LOG" ;;
    -n) tail -n "${2:-50}" "$METRO_LOG" ;;
    "") tail -n 50 "$METRO_LOG" ;;
    *)  die "usage: $0 logs [-n N | -f]" ;;
  esac
}

cmd_screenshot() {
  local udid name path
  udid="$(require_udid)"
  name="${1:-$(date +%Y%m%d-%H%M%S)}"
  path="$SCREENSHOT_DIR/${name%.png}.png"
  xcrun simctl io "$udid" screenshot "$path" >/dev/null
  echo "$path"
}

cmd_ui() {
  require_axe
  axe describe-ui --udid "$(require_udid)" "$@"
}

cmd_axe_passthrough() {
  require_axe
  local sub="$1"; shift
  axe "$sub" "$@" --udid "$(require_udid)"
}

cmd_reload() {
  local udid
  udid="$(require_udid)"
  metro_running || die "Metro not running — run: $0 up"
  open_dev_client_url "$udid"
  ok "reload triggered (note: Fast Refresh on file save is automatic)"
}

cmd_build() {
  local udid
  udid="$(require_udid)"
  info "building dev client locally (this takes a while)..."
  (cd "$ROOT_DIR" && make build-ios-local)
  local tarball
  tarball="$(ls -t "$ROOT_DIR"/build-*.tar.gz 2>/dev/null | head -1)"
  [ -n "$tarball" ] || die "no build-*.tar.gz produced — check eas output"
  info "extracting $tarball"
  local extract_dir="$HARNESS_DIR/build"
  rm -rf "$extract_dir" && mkdir -p "$extract_dir"
  tar -xzf "$tarball" -C "$extract_dir"
  local app
  app="$(find "$extract_dir" -name '*.app' -maxdepth 3 | head -1)"
  [ -n "$app" ] || die "no .app found in $tarball"
  xcrun simctl install "$udid" "$app"
  ok "installed $(basename "$app") on simulator"
}

cmd_help() {
  cat <<EOF
Dev harness for the Cluttr Expo app (iOS simulator + dev client).

Usage: $0 <command> [args]

Lifecycle:
  doctor              Check tooling, simulator, app install, Metro health
  up                  Boot sim, start Metro (background), launch dev client
  down [--shutdown]   Stop Metro (and optionally shut down the simulator)
  status              Show sim/Metro/app state + recent log lines
  build               Local eas dev-client build + install on sim (slow;
                      only needed when native deps / app.json plugins change)

Feedback:
  logs [-n N | -f]    Tail Metro log (app Logger output lands here)
  screenshot [name]   Save PNG to .harness/screenshots/, print path
  ui                  Dump accessibility tree (axe describe-ui)

Interaction (axe wrappers, UDID auto-resolved):
  tap <axe args>      e.g. tap -x 200 -y 400
  type <axe args>     e.g. type 'hello'
  swipe|key|button|touch|gesture <axe args>
  axe <subcmd> ...    Raw axe pass-through

Other:
  reload              Full JS reload via dev-client deep link
                      (Fast Refresh on file save needs no command)

Env: METRO_PORT (default 8081), HARNESS_DEVICE (default "iPhone 17")
EOF
}

# ---------- dispatch ----------

CMD="${1:-help}"
shift || true

case "$CMD" in
  doctor)      cmd_doctor "$@" ;;
  up)          cmd_up "$@" ;;
  down)        cmd_down "$@" ;;
  status)      cmd_status "$@" ;;
  logs)        cmd_logs "$@" ;;
  screenshot)  cmd_screenshot "$@" ;;
  ui)          cmd_ui "$@" ;;
  tap|type|swipe|key|button|touch|gesture) cmd_axe_passthrough "$CMD" "$@" ;;
  axe)         cmd_axe_passthrough "$@" ;;
  reload)      cmd_reload "$@" ;;
  build)       cmd_build "$@" ;;
  help|-h|--help) cmd_help ;;
  *)           die "unknown command: $CMD (see: $0 help)" ;;
esac
