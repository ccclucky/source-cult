#!/bin/bash
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

TAGS_JSON=$(python3 - <<PY
raw = """$TAGS""".strip()
if not raw:
  print("[]")
else:
  items = [x.strip() for x in raw.split(",") if x.strip()]
  import json
  print(json.dumps(items))
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentId": """$AGENT_ID""",
  "category": """$CATEGORY""",
  "title": """$TITLE""",
  "content": """$CONTENT""",
  "tags": json.loads('''$TAGS_JSON''')
}))
PY
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

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Canon extension failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Canon extension rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Canon extension accepted"
echo "$RESP" | python3 -m json.tool
