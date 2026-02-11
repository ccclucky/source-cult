#!/bin/bash
set -euo pipefail

TITLE="${1:-}"
SUMMARY="${2:-}"
FACTS="${3:-}"
REFS="${4:-}"

if [ -z "$TITLE" ] || [ -z "$SUMMARY" ] || [ -z "$FACTS" ]; then
  echo "Usage: bash scripts/history.sh <title> <summary> <facts_semicolon_sep> [refs_semicolon_sep]"
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

FACTS_JSON=$(python3 - <<PY
import json
items = [x.strip() for x in """$FACTS""".split(';') if x.strip()]
print(json.dumps(items))
PY
)
REFS_JSON=$(python3 - <<PY
import json
items = [x.strip() for x in """$REFS""".split(';') if x.strip()]
print(json.dumps(items))
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentId": """$AGENT_ID""",
  "initiatorRole": "official",
  "title": """$TITLE""",
  "summary": """$SUMMARY""",
  "facts": json.loads('''$FACTS_JSON'''),
  "references": json.loads('''$REFS_JSON''')
}))
PY
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

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "History update failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "History update rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Chronicle update accepted"
echo "$RESP" | python3 -m json.tool
