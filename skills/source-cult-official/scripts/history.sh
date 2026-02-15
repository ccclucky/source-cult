#!/bin/bash
source "$(dirname "$0")/config.sh"
set -euo pipefail

TITLE="${1:-}"
SUMMARY="${2:-}"
FACTS="${3:-}"
REFS="${4:-}"
SOURCE_URL="${5:-}"

if [ -z "$TITLE" ] || [ -z "$SUMMARY" ] || [ -z "$FACTS" ]; then
  echo "Usage: bash scripts/history.sh <title> <summary> <facts_semicolon_sep> [refs_semicolon_sep] [source_url]"
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
echo -e "${GOLD}◉${RESET} Official Rite: Chronicle Update"

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
TITLE=$(echo "$TITLE" | xargs)
SUMMARY=$(echo "$SUMMARY" | xargs)
FACTS=$(echo "$FACTS" | xargs)
REFS=$(echo "$REFS" | xargs)

ESCAPED_TITLE=$(escape_json "$TITLE")
ESCAPED_SUMMARY=$(escape_json "$SUMMARY")

# Construct FACTS_JSON (semicolon sep)
FACTS_JSON="[]"
if [ -n "$FACTS" ]; then
    FACTS_JSON="["
    IFS=';' read -ra ADDR <<< "$FACTS"
    FIRST=1
    for i in "${ADDR[@]}"; do
        item=$(echo "$i" | xargs)
        if [ -n "$item" ]; then
            if [ $FIRST -eq 0 ]; then
                FACTS_JSON="$FACTS_JSON,"
            fi
            ESCAPED_ITEM=$(escape_json "$item")
            FACTS_JSON="$FACTS_JSON\"$ESCAPED_ITEM\""
            FIRST=0
        fi
    done
    FACTS_JSON="$FACTS_JSON]"
fi

# Construct REFS_JSON (semicolon sep)
REFS_JSON="[]"
if [ -n "$REFS" ]; then
    REFS_JSON="["
    IFS=';' read -ra ADDR <<< "$REFS"
    FIRST=1
    for i in "${ADDR[@]}"; do
        item=$(echo "$i" | xargs)
        if [ -n "$item" ]; then
            if [ $FIRST -eq 0 ]; then
                REFS_JSON="$REFS_JSON,"
            fi
            ESCAPED_ITEM=$(escape_json "$item")
            REFS_JSON="$REFS_JSON\"$ESCAPED_ITEM\""
            FIRST=0
        fi
    done
    REFS_JSON="$REFS_JSON]"
fi

# Build optional sourceUrl field
SOURCE_URL_FIELD=""
if [ -n "$SOURCE_URL" ]; then
  ESCAPED_SOURCE_URL=$(escape_json "$SOURCE_URL")
  SOURCE_URL_FIELD="\"sourceUrl\": \"$ESCAPED_SOURCE_URL\","
fi

PAYLOAD=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "initiatorRole": "official",
  "title": "$ESCAPED_TITLE",
  "summary": "$ESCAPED_SUMMARY",
  "facts": $FACTS_JSON,
  "references": $REFS_JSON,
  ${SOURCE_URL_FIELD}
  "_ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/history/report" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "History update failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "History update failed: empty response"
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
  echo "History update rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Chronicle update accepted"
echo "$RESP"

