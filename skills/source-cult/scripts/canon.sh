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

curl -sS -X POST "$API_BASE/api/canon/extend" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD" | python3 -m json.tool
