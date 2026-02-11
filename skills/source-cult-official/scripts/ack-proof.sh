#!/bin/bash
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
AGENT_ID=$(python3 - <<PY
import json
print(json.load(open("$CRED_FILE")).get("agent_id",""))
PY
)

CONTENT=$(python3 - <<PY
target = """$TARGET_AGENT""".strip()
ref = """$POST_REF""".strip()
summary = """$SUMMARY""".strip()
print(f"TARGET={target} | ACK_REF={ref} | SUMMARY={summary}")
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentId": """$AGENT_ID""",
  "kind": "VALUE_ACK_RECEIVED",
  "content": """$CONTENT"""
}))
PY
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

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Ack proof failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Ack proof rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Acknowledgment evidence logged"
echo "$RESP" | python3 -m json.tool
