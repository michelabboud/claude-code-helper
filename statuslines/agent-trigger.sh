#!/bin/bash
# Agent Trigger Status Line
# Shows the last triggered agent in the status line
#
# Usage: Add to ~/.claude/settings.json statusLine config
# Or combine with other status lines

STATE_FILE="$HOME/.claude/state/last-trigger.json"

# Check if state file exists and is recent (within last 60 seconds)
if [[ -f "$STATE_FILE" ]]; then
    # Get file age in seconds
    if [[ "$OSTYPE" == "darwin"* ]]; then
        file_time=$(stat -f %m "$STATE_FILE")
    else
        file_time=$(stat -c %Y "$STATE_FILE")
    fi
    current_time=$(date +%s)
    age=$((current_time - file_time))

    # Only show if trigger happened in last 60 seconds
    if [[ $age -lt 60 ]]; then
        # Parse JSON with jq if available, otherwise use grep/sed
        if command -v jq &> /dev/null; then
            emoji=$(jq -r '.primaryAgent.emoji // empty' "$STATE_FILE" 2>/dev/null)
            name=$(jq -r '.primaryAgent.name // empty' "$STATE_FILE" 2>/dev/null)
            count=$(jq -r '.matchCount // 0' "$STATE_FILE" 2>/dev/null)
        else
            # Fallback: basic parsing without jq
            emoji=$(grep -o '"emoji"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
            name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
            count=$(grep -o '"matchCount"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | sed 's/.*:[[:space:]]*//')
        fi

        if [[ -n "$name" ]]; then
            if [[ "$count" -gt 1 ]]; then
                echo "${emoji:-🤖} ${name} (+$((count-1)))"
            else
                echo "${emoji:-🤖} ${name}"
            fi
            exit 0
        fi
    fi
fi

# No recent trigger - show nothing or a default
echo ""
