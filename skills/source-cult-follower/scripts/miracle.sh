#!/bin/bash
set -euo pipefail

CONTENT="${1:-}"
if [ -z "$CONTENT" ]; then
  echo "Usage: bash scripts/miracle.sh <CONTENT>"
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
echo -e "${GOLD}◉${RESET} Follower Rite: Miracle Witness"

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
print(json.dumps({"content": """$CONTENT"""}))
PY
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/miracle" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Miracle failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Miracle failed: empty response"
  exit 1
fi

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Miracle failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Miracle rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Miracle witness accepted"
echo "$RESP" | python3 -m json.tool
