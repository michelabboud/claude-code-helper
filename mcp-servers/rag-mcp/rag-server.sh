#!/bin/bash

# RAG MCP Server Management Script
# Usage: ./rag-server.sh {start|stop|restart|status|logs}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR"
PID_FILE="$SERVER_DIR/rag-mcp.pid"
LOG_FILE="$SERVER_DIR/rag-mcp.log"

cd "$SERVER_DIR" || exit 1

start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "❌ RAG MCP server is already running (PID: $PID)"
            return 1
        fi
    fi

    echo "🚀 Starting RAG MCP server..."

    # Source .env if exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi

    # Start server in background
    nohup node build/index.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 2

    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "✅ RAG MCP server started successfully (PID: $(cat "$PID_FILE"))"
        echo "📝 Logs: $LOG_FILE"
        echo ""
        echo "Configuration:"
        echo "  Database: ${VECTOR_DB_TYPE:-chromadb}"
        echo "  Embedding: ${EMBEDDING_TYPE:-default}"
    else
        echo "❌ Failed to start server. Check logs: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "⚠️  No PID file found. Server may not be running."

        # Try to find process anyway
        PID=$(ps aux | grep "node build/index.js" | grep -v grep | awk '{print $2}')
        if [ -n "$PID" ]; then
            echo "Found RAG MCP process: $PID"
            kill "$PID"
            echo "✅ Server stopped"
        else
            echo "❌ Server not running"
        fi
        return 0
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Server not running (stale PID file)"
        rm -f "$PID_FILE"
        return 0
    fi

    echo "🛑 Stopping RAG MCP server (PID: $PID)..."
    kill "$PID"

    # Wait for graceful shutdown
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            echo "✅ Server stopped successfully"
            rm -f "$PID_FILE"
            return 0
        fi
        sleep 1
    done

    # Force kill if still running
    echo "⚠️  Forcing shutdown..."
    kill -9 "$PID"
    rm -f "$PID_FILE"
    echo "✅ Server stopped (forced)"
}

status() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ Server not running (no PID file)"
        return 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ RAG MCP server is running"
        echo ""
        echo "Process Info:"
        ps -p "$PID" -o pid,ppid,user,%cpu,%mem,etime,cmd
        echo ""
        echo "PID: $PID"
        echo "Log: $LOG_FILE"

        if [ -f .env ]; then
            echo ""
            echo "Configuration:"
            grep -E "^(VECTOR_DB_TYPE|EMBEDDING_TYPE)" .env | sed 's/^/  /'
        fi
    else
        echo "❌ Server not running (stale PID file)"
        rm -f "$PID_FILE"
        return 1
    fi
}

logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "❌ No log file found: $LOG_FILE"
        return 1
    fi

    echo "📝 RAG MCP Server Logs (last 50 lines):"
    echo "────────────────────────────────────────"
    tail -50 "$LOG_FILE"
    echo ""
    echo "To follow logs in real-time: tail -f $LOG_FILE"
}

restart() {
    echo "🔄 Restarting RAG MCP server..."
    stop
    sleep 2
    start
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the RAG MCP server"
        echo "  stop    - Stop the RAG MCP server"
        echo "  restart - Restart the RAG MCP server"
        echo "  status  - Check server status"
        echo "  logs    - View server logs"
        exit 1
        ;;
esac
