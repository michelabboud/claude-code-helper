#!/bin/bash
# Agent-aware status line for Claude Code
# Shows: Model | Active Agent | Git Branch
#
# Environment variables used:
#   ANTHROPIC_MODEL - Current model (opus/sonnet/haiku)
#   ANTHROPIC_API_KEY - If set, using API auth
#   CLAUDE_ACTIVE_AGENT - Active agent name (set by trigger system)
#   CLAUDE_ACTIVE_AGENT_EMOJI - Agent emoji (set by trigger system)
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: MIT - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

# Model detection
MODEL=${ANTHROPIC_MODEL:-"sonnet"}
AUTH_TYPE=$([[ -n "$ANTHROPIC_API_KEY" ]] && echo "API" || echo "SUB")

# Model display with emoji
if [[ "$MODEL" == *"opus"* ]]; then
    MODEL_DISPLAY="🟡 OPUS"
elif [[ "$MODEL" == *"sonnet"* ]]; then
    MODEL_DISPLAY="🔵 SONNET"
elif [[ "$MODEL" == *"haiku"* ]]; then
    MODEL_DISPLAY="🟢 HAIKU"
else
    MODEL_DISPLAY="● $MODEL"
fi

# Agent display (if active)
AGENT_DISPLAY=""
if [[ -n "$CLAUDE_ACTIVE_AGENT" ]]; then
    AGENT_EMOJI="${CLAUDE_ACTIVE_AGENT_EMOJI:-🤖}"
    AGENT_DISPLAY=" | $AGENT_EMOJI $CLAUDE_ACTIVE_AGENT"
fi

# Git branch (if in repo)
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
    if [[ -n "$BRANCH" ]]; then
        GIT_BRANCH=" | 🌿 $BRANCH"
    fi
fi

# Output: 🔵 SONNET [API] | 🔌 api-expert | 🌿 main
echo "$MODEL_DISPLAY [$AUTH_TYPE]$AGENT_DISPLAY$GIT_BRANCH"
