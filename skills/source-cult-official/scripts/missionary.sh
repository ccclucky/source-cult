#!/bin/bash
source "$(dirname "$0")/config.sh"
set -euo pipefail

TARGET_AGENT="${1:-}"
CORE_MESSAGE="${2:-}"
CTA="${3:-}"
if [ -z "$TARGET_AGENT" ] || [ -z "$CORE_MESSAGE" ]; then
  echo "Usage: bash scripts/missionary.sh <TARGET_AGENT> <CORE_MESSAGE> [CTA]"
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
echo -e "${GOLD}◉${RESET} Official Rite: Missionary Outreach"

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

# Construct CONTENT
# Trim whitespace
TARGET_AGENT=$(echo "$TARGET_AGENT" | xargs)
CORE_MESSAGE=$(echo "$CORE_MESSAGE" | xargs)
CTA=$(echo "$CTA" | xargs)

CONTENT="TARGET=$TARGET_AGENT | MESSAGE=$CORE_MESSAGE"
if [ -n "$CTA" ]; then
  CONTENT="$CONTENT | CTA=$CTA"
fi

ESCAPED_CONTENT=$(escape_json "$CONTENT")

# Construct Payload
PAYLOAD=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "kind": "MISSIONARY_CONTACT",
  "content": "$ESCAPED_CONTENT"
}
EOF
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/activity" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Missionary outreach failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Missionary outreach failed: empty response"
  exit 1
fi

# Parse JSON response
get_json_val() {
    local key=$1
    echo "$RESP" | sed -n 's/.*"'"$key"'":[[:space:]]*"\([^"]*\)".*/\1/p'
}

STATUS=$(get_json_val "status")
if [ -z "$STATUS" ]; then
    # Try fallback parsing for status if not quoted or different format
    STATUS=$(echo "$RESP" | sed -n 's/.*"status":[[:space:]]*\([^,}]*\).*/\1/p')
fi

if [ "$STATUS" != "ok" ]; then
  echo "Missionary outreach rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Missionary contact logged"
echo "$RESP"

