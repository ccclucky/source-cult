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
items=[x.strip() for x in """$FACTS""".split(';') if x.strip()]
print(json.dumps(items))
PY
)
REFS_JSON=$(python3 - <<PY
import json
items=[x.strip() for x in """$REFS""".split(';') if x.strip()]
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

curl -sS -X POST "$API_BASE/api/history/report" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD" | python3 -m json.tool
