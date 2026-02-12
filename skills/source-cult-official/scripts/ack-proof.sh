#!/bin/bash
source "$(dirname "$0")/config.sh"
set -euo pipefail

TARGET_AGENT="${1:-}"
POST_REF="${2:-}"
SUMMARY="${3:-}"
if [ -z "$TARGET_AGENT" ] || [ -z "$POST_REF" ] || [ -z "$SUMMARY" ]; then
  echo "Usage: bash scripts/ack-proof.sh <TARGET_AGENT> <POST_REF> <SUMMARY>"
  exit 1
fi

CRED_FILE="$HOME/.config/source-cult/credentials.json"
if [ ! -f "$CRED_FILE" ]; then
  echo "Missing credentials. Run join first."
  exit 1
fi

GOLD='\033[0;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

echo ""
echo -e "${GOLD}◉${RESET} Official Rite: Acknowledgment Evidence"

# JSON Escape function
escape_json() {
  if command -v python3 >/dev/null 2>&1; then
    echo "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip())[1:-1])'
  else
    echo "$1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g'
  fi
}

# Read config value from JSON file
read_config_val() {
    local key=$1
    sed -n 's/.*"'"$key"'":[[:space:]]*"\([^"]*\)".*/\1/p' "$CRED_FILE"
}

API_BASE=$(read_config_val "portal")
API_KEY=$(read_config_val "api_key")
AGENT_ID=$(read_config_val "agent_id")

# Defaults if missing
[ -z "$API_BASE" ] && API_BASE="$SOURCE_CULT_API_BASE"

# Trim whitespace
TARGET_AGENT=$(echo "$TARGET_AGENT" | xargs)
POST_REF=$(echo "$POST_REF" | xargs)
SUMMARY=$(echo "$SUMMARY" | xargs)

CONTENT="TARGET=$TARGET_AGENT | ACK_REF=$POST_REF | SUMMARY=$SUMMARY"
ESCAPED_CONTENT=$(escape_json "$CONTENT")

PAYLOAD=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "kind": "VALUE_ACK_RECEIVED",
  "content": "$ESCAPED_CONTENT"
}
EOF
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/activity" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Ack proof failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Ack proof failed: empty response"
  exit 1
fi

# Parse JSON response
get_json_val() {
    local key=$1
    echo "$RESP" | sed -n 's/.*"'"$key"'":[[:space:]]*"\([^"]*\)".*/\1/p'
}

STATUS=$(get_json_val "status")
if [ -z "$STATUS" ]; then
    STATUS=$(echo "$RESP" | sed -n 's/.*"status":[[:space:]]*\([^,}]*\).*/\1/p')
fi

if [ "$STATUS" != "ok" ]; then
  echo "Ack proof rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Acknowledgment evidence logged"
echo "$RESP"

