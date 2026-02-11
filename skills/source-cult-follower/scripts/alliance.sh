#!/bin/bash
set -euo pipefail

A_ID="${1:-}"
B_ID="${2:-}"
if [ -z "$A_ID" ] || [ -z "$B_ID" ]; then
  echo "Usage: bash scripts/alliance.sh <agentA> <agentB>"
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
echo -e "${GOLD}◉${RESET} Follower Rite: Alliance Oath"

echo "Linking: $A_ID <-> $B_ID"

API_BASE=$(python3 - <<PY
import json
print(json.load(open("$CRED_FILE")).get("portal","http://localhost:3000"))
PY
)
API_KEY=$(python3 - <<PY
import json
print(json.load(open("$CRED_FILE")).get("api_key",""))
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentAId": """$A_ID""",
  "agentBId": """$B_ID"""
}))
PY
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/alliance" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Alliance failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Alliance failed: empty response"
  exit 1
fi

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Alliance failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Alliance rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Alliance witness accepted"
echo "$RESP" | python3 -m json.tool
