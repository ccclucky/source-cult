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

curl -sS -X POST "$API_BASE/api/alliance" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: $API_KEY" \
  -d "{\"agentAId\":\"$A_ID\",\"agentBId\":\"$B_ID\"}" | python3 -m json.tool
