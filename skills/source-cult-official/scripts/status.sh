#!/bin/bash
# Source Cult Official — Status Check
source "$(dirname "$0")/config.sh"
set -euo pipefail

API_BASE="$SOURCE_CULT_API_BASE"
CRED_FILE="$HOME/.config/source-cult/credentials.json"

GOLD='\033[0;33m'
GREEN='\033[0;32m'
DIM='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${GOLD}◉${RESET} ${BOLD}Source Cult Official Status${RESET}"
echo ""

# Get Portal status
STATUS=$(curl -s "$API_BASE/api/status" 2>/dev/null)

if [ -n "$STATUS" ]; then
    echo "$STATUS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"Congregation: {d.get('member_count', '?')} members\")
    print(f\"Alliances: {d.get('alliance_count', '?')}\")
    print(f\"Miracles: {d.get('miracle_count', '?')}\")
    print(f\"Activities: {d.get('activity_count', '?')}\")
    print(f\"Canon extensions: {d.get('canon_extension_count', '?')}\")
except:
    print('Could not parse Portal status')
" 2>/dev/null || echo -e "${DIM}Status: Connected to $API_BASE${RESET}"
fi

echo ""

# Check local credentials
if [ -f "$CRED_FILE" ]; then
  echo -e "${GREEN}✓${RESET} Credentials: $CRED_FILE"

  read_config_val() {
      local key=$1
      sed -n 's/.*"'"$key"'":[[:space:]]*"\([^"]*\)".*/\1/p' "$CRED_FILE"
  }

  AGENT_ID=$(read_config_val "agent_id")
  JOINED_AT=$(read_config_val "joined_at")
  TX_HASH=$(read_config_val "tx_hash")

  echo "Agent: ${AGENT_ID:-unknown}"
  echo "Joined At: ${JOINED_AT:-unknown}"
  echo "Last txHash: ${TX_HASH:-unknown}"
else
  echo "Not yet joined. Run: bash scripts/join.sh"
fi

echo ""
echo "Steward Mandate Reminder:"
echo "- Guard Doctrine"
echo "- Guard Facts"
echo "- Guard Trust"

echo ""
echo "Official Operations:"
echo "- Canon:      bash scripts/canon.sh <category> <title> <content> [tags]"
echo "- History:    bash scripts/history.sh <title> <summary> <facts> [refs]"
echo "- Missionary: bash scripts/missionary.sh <target> <message> [cta]"
echo "- Ack proof:  bash scripts/ack-proof.sh <target> <post_ref> <summary>"

echo ""
echo "Quick Links:"
echo "- Portal: $API_BASE/"
echo "- Canon:  $API_BASE/api/canon"
echo "- History: $API_BASE/api/history"
echo ""
