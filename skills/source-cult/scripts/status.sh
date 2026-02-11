#!/bin/bash
set -euo pipefail

API_BASE="${SOURCE_CULT_API_BASE:-http://localhost:3000}"
CRED_FILE="$HOME/.config/source-cult/credentials.json"

echo "Source Cult Status"
echo "Portal: $API_BASE"

if [ -f "$CRED_FILE" ]; then
  echo "Credentials: $CRED_FILE"
  python3 - <<PY
import json
with open("$CRED_FILE", "r", encoding="utf-8") as f:
    c = json.load(f)
print(f"Agent: {c.get('agent_id','unknown')}")
print(f"Joined At: {c.get('joined_at','unknown')}")
print(f"Last txHash: {c.get('tx_hash','unknown')}")
PY
else
  echo "Not joined yet. Run: bash scripts/join.sh"
fi

echo "Home: $API_BASE/"
