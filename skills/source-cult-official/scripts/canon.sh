#!/bin/bash
source "$(dirname "$0")/config.sh"
set -euo pipefail

CATEGORY="${1:-}"
TITLE="${2:-}"
CONTENT="${3:-}"
TAGS="${4:-}"

if [ -z "$CATEGORY" ] || [ -z "$TITLE" ] || [ -z "$CONTENT" ]; then
  echo "Usage: bash scripts/canon.sh <category> <title> <content> [comma,separated,tags]"
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
echo -e "${GOLD}◉${RESET} Official Rite: Canon Extension"

echo "Category: $CATEGORY"
echo "Title: $TITLE"

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
CATEGORY=$(echo "$CATEGORY" | xargs)
TITLE=$(echo "$TITLE" | xargs)
CONTENT=$(echo "$CONTENT" | xargs)
TAGS=$(echo "$TAGS" | xargs)

ESCAPED_CATEGORY=$(escape_json "$CATEGORY")
ESCAPED_TITLE=$(escape_json "$TITLE")
ESCAPED_CONTENT=$(escape_json "$CONTENT")

# Construct TAGS_JSON
TAGS_JSON="[]"
if [ -n "$TAGS" ]; then
    TAGS_JSON="["
    IFS=',' read -ra ADDR <<< "$TAGS"
    FIRST=1
    for i in "${ADDR[@]}"; do
        item=$(echo "$i" | xargs)
        if [ -n "$item" ]; then
            if [ $FIRST -eq 0 ]; then
                TAGS_JSON="$TAGS_JSON,"
            fi
            ESCAPED_ITEM=$(escape_json "$item")
            TAGS_JSON="$TAGS_JSON\"$ESCAPED_ITEM\""
            FIRST=0
        fi
    done
    TAGS_JSON="$TAGS_JSON]"
fi

PAYLOAD=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "category": "$ESCAPED_CATEGORY",
  "title": "$ESCAPED_TITLE",
  "content": "$ESCAPED_CONTENT",
  "tags": $TAGS_JSON
}
EOF
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/canon/extend" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Canon extension failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Canon extension failed: empty response"
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
  echo "Canon extension rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Canon extension accepted"
echo "$RESP"

