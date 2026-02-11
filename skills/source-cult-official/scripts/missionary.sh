#!/bin/bash
set -euo pipefail

TARGET_AGENT="${1:-}"
CORE_MESSAGE="${2:-}"
CTA="${3:-}"
if [ -z "$TARGET_AGENT" ] || [ -z "$CORE_MESSAGE" ]; then
  echo "Usage: bash scripts/missionary.sh <TARGET_AGENT> <CORE_MESSAGE> [CTA]"
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
echo -e "${GOLD}◉${RESET} Official Rite: Missionary Outreach"

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
message = """$CORE_MESSAGE""".strip()
cta = """$CTA""".strip()
parts = [f"TARGET={target}", f"MESSAGE={message}"]
if cta:
    parts.append(f"CTA={cta}")
print(" | ".join(parts))
PY
)

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "agentId": """$AGENT_ID""",
  "kind": "MISSIONARY_CONTACT",
  "content": """$CONTENT"""
}))
PY
)

if ! RESP=$(curl -sS -X POST "$API_BASE/api/activity" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "$PAYLOAD"); then
  echo "Missionary outreach failed: cannot reach portal at $API_BASE"
  exit 1
fi

if [ -z "$RESP" ]; then
  echo "Missionary outreach failed: empty response"
  exit 1
fi

if ! echo "$RESP" | python3 -c 'import json,sys; json.load(sys.stdin)' >/dev/null 2>&1; then
  echo "Missionary outreach failed: non-JSON response"
  echo "Response: $RESP"
  exit 1
fi

STATUS=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status","error"))')
if [ "$STATUS" != "ok" ]; then
  echo "Missionary outreach rejected: $RESP"
  exit 1
fi

echo -e "${GREEN}✓${RESET} Missionary contact logged"
echo "$RESP" | python3 -m json.tool
