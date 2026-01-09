#!/bin/bash
# Detailed status line showing model, auth type, and git branch

# Get model info
MODEL=${ANTHROPIC_MODEL:-"sonnet"}

# Get auth type
if [ -n "$ANTHROPIC_API_KEY" ]; then
    AUTH="API"
else
    AUTH="SUB"
fi

# Get git branch if in repo
BRANCH=$(git branch --show-current 2>/dev/null)
if [ -n "$BRANCH" ]; then
    GIT=" | $BRANCH"
else
    GIT=""
fi

# Determine model and display
if [[ "$MODEL" == *"opus"* ]]; then
    echo "🟡 OPUS [$AUTH]${GIT}"
elif [[ "$MODEL" == *"sonnet"* ]]; then
    echo "🔵 SONNET [$AUTH]${GIT}"
elif [[ "$MODEL" == *"haiku"* ]]; then
    echo "🟢 HAIKU [$AUTH]${GIT}"
else
    echo "● $MODEL [$AUTH]${GIT}"
fi
