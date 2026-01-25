#!/bin/bash
# Simple model display for Claude Code status line
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: Apache-2.0 - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

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
