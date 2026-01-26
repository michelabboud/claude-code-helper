#!/bin/bash
# Combined Status Line
# Shows model info + last triggered agent
#
# Format: [MODEL] | [AGENT_TRIGGER]

# Get model status (if model-display.sh exists)
MODEL_STATUS=""
if [[ -x "$HOME/.claude/statuslines/model-display.sh" ]]; then
    MODEL_STATUS=$("$HOME/.claude/statuslines/model-display.sh" 2>/dev/null)
fi

# Get agent trigger status
AGENT_STATUS=""
if [[ -x "$HOME/.claude/statuslines/agent-trigger.sh" ]]; then
    AGENT_STATUS=$("$HOME/.claude/statuslines/agent-trigger.sh" 2>/dev/null)
fi

# Combine outputs
if [[ -n "$MODEL_STATUS" && -n "$AGENT_STATUS" ]]; then
    echo "$MODEL_STATUS | $AGENT_STATUS"
elif [[ -n "$MODEL_STATUS" ]]; then
    echo "$MODEL_STATUS"
elif [[ -n "$AGENT_STATUS" ]]; then
    echo "$AGENT_STATUS"
else
    echo ""
fi
