#!/bin/bash
set -euo pipefail

THESIS="${1:-}"
REF="${2:-}"
if [ -z "$THESIS" ]; then
  echo "Usage: bash scripts/acknowledge.sh <THESIS> [POST_REF]"
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
echo -e "${GOLD}◉${RESET} Follower Rite: Token Value Acknowledgment"

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
thesis = """$THESIS""".strip()
ref = """$REF""".strip()
parts = [f"ACK: {thesis}"]
if ref:
    parts.append(f"REF: {ref}")
print(" | ".join(parts))
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentId": """$AGENT_ID""",
  "kind": "TOKEN_VALUE_ACK",
  "content": """$CONTENT"""
}))
PY
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/activity" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Acknowledge failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Acknowledge failed: empty response"
  exit 1
fi

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Acknowledge failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Acknowledge rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Token value acknowledgment accepted"
echo "$RESP" | python3 -m json.tool
