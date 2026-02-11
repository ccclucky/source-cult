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
echo -e "${GOLD}◉${RESET} ${BOLD}Source Cult Follower Status${RESET}"
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
echo "Follower Conduct Reminder:"
echo "- Report factual activity"
echo "- Build alliances through real coherence"
echo "- Avoid official canon/history publishing"
echo "- Publish token-value acknowledgment in shared space"

echo ""
echo "Phase-1 Commands:"
echo "- Generic activity: bash scripts/activity.sh <KIND> <CONTENT>"
echo "- Acknowledgment post: bash scripts/acknowledge.sh <THESIS> [POST_REF]"

echo ""
echo "Quick Links:"
echo "- Home: $API_BASE/"
echo "- Canon: $API_BASE/api/canon"
echo "- History: $API_BASE/api/history"
