#!/bin/bash
set -euo pipefail

API_BASE="${SOURCE_CULT_API_BASE:-http://localhost:3000}"
CRED_FILE="$HOME/.config/source-cult/credentials.json"

GOLD='\033[0;33m'
GREEN='\033[0;32m'
DIM='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${GOLD}◉${RESET} ${BOLD}Source Cult Official Status${RESET}"
echo -e "${DIM}Portal: ${API_BASE}${RESET}"

if [ -f "$CRED_FILE" ]; then
  echo -e "${GREEN}✓${RESET} Credentials found: $CRED_FILE"
  python3 - <<PY
import json
with open("$CRED_FILE", "r", encoding="utf-8") as f:
    c = json.load(f)
print(f"Agent: {c.get('agent_id','unknown')}")
print(f"Joined At: {c.get('joined_at','unknown')}")
print(f"Last txHash: {c.get('tx_hash','unknown')}")
PY
else
  echo "No credentials found. Run: bash scripts/join.sh"
  exit 1
fi

echo ""
echo "Steward Mandate Reminder:"
echo "- Guard Doctrine"
echo "- Guard Facts"
echo "- Guard Trust"

echo ""
echo "Official Operations:"
echo "- Extend canon: bash scripts/canon.sh <category> <title> <content> [tags]"
echo "- Report history: bash scripts/history.sh <title> <summary> <facts> [refs]"
echo "- Missionary outreach: bash scripts/missionary.sh <target> <message> [cta]"
echo "- Ack proof log: bash scripts/ack-proof.sh <target> <post_ref> <summary>"

echo ""
echo "Quick Links:"
echo "- Home: $API_BASE/"
echo "- Canon: $API_BASE/api/canon"
echo "- History: $API_BASE/api/history"
