#!/bin/bash
# Toggle model observability (response prefixes)
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: Apache-2.0 - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

MODE=${1:-on}

if [ "$MODE" = "on" ]; then
    echo "✅ Model observability ENABLED"
    echo ""
    echo "I will now prefix all responses with [model-name]"
    echo ""
    echo "Examples:"
    echo "  [sonnet] Your response..."
    echo "  [opusplan] Planning..."
    echo "  [haiku] Quick fix..."
elif [ "$MODE" = "off" ]; then
    echo "❌ Model observability DISABLED"
    echo ""
    echo "I will respond normally without model prefix"
elif [ "$MODE" = "status" ]; then
    echo "📊 Observability Status"
    echo ""
    echo "Current model: ${ANTHROPIC_MODEL:-sonnet}"
    echo "Auth type: $([[ -n "$ANTHROPIC_API_KEY" ]] && echo "API" || echo "Subscription")"
    echo ""
    echo "To check model in session: /status"
else
    echo "Usage: /observability [on|off|status]"
    echo ""
    echo "Examples:"
    echo "  /observability on      - Enable model prefixes"
    echo "  /observability off     - Disable model prefixes"
    echo "  /observability status  - Show current status"
fi
