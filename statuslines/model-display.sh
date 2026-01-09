#!/bin/bash
# Simple model display for Claude Code status line

MODEL=${ANTHROPIC_MODEL:-"sonnet"}
AUTH_TYPE=$([[ -n "$ANTHROPIC_API_KEY" ]] && echo "API" || echo "SUB")

# Determine model and display with emoji
if [[ "$MODEL" == *"opus"* ]]; then
    echo "🟡 OPUS [$AUTH_TYPE]"
elif [[ "$MODEL" == *"sonnet"* ]]; then
    echo "🔵 SONNET [$AUTH_TYPE]"
elif [[ "$MODEL" == *"haiku"* ]]; then
    echo "🟢 HAIKU [$AUTH_TYPE]"
else
    echo "● $MODEL [$AUTH_TYPE]"
fi
