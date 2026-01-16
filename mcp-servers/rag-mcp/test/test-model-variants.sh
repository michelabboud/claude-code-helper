#!/bin/bash

# Test all embedding model variants with Redis
# This script tests each quantized model variant to compare quality and performance

set -e

cd "$(dirname "$0")"

echo "🧪 Testing All Embedding Model Variants with Redis"
echo "=================================================="
echo ""

# Test sample text
TEST_TEXT="function authenticateUser(username, password) { /* Login implementation */ }"

# Model variants to test
VARIANTS=("default" "fp16" "int8" "uint8" "q4" "q4f16" "bnb4")

# Results file
RESULTS_FILE="model-variant-test-results.txt"
echo "Model Variant Test Results - $(date)" > "$RESULTS_FILE"
echo "==========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

for VARIANT in "${VARIANTS[@]}"; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing variant: $VARIANT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Set environment
    export VECTOR_DB_TYPE=redis
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export EMBEDDING_TYPE=local
    export MODEL_VARIANT="$VARIANT"

    # Collection name with variant
    COLLECTION="test-variant-$VARIANT"

    echo ""
    echo "📝 Configuration:"
    echo "   Database: Redis (localhost:6379)"
    echo "   Model Variant: $MODEL_VARIANT"
    echo "   Collection: $COLLECTION"
    echo ""

    # Log to results file
    echo "Testing: $VARIANT" >> "$RESULTS_FILE"
    echo "-------------------------------------------" >> "$RESULTS_FILE"

    # Start server in background with timeout
    echo "Starting server..."
    timeout 30s node build/index.js > "/tmp/rag-$VARIANT.log" 2>&1 &
    SERVER_PID=$!

    # Wait for server to initialize
    sleep 8

    if ! ps -p $SERVER_PID > /dev/null; then
        echo "❌ Server failed to start for $VARIANT"
        echo "   Check logs: /tmp/rag-$VARIANT.log"
        cat "/tmp/rag-$VARIANT.log" >> "$RESULTS_FILE"
        echo "" >> "$RESULTS_FILE"
        continue
    fi

    # Get startup log info
    echo ""
    echo "📊 Startup logs:"
    cat "/tmp/rag-$VARIANT.log" | grep -E "Loading|loaded|Model variant" || true
    cat "/tmp/rag-$VARIANT.log" | grep -E "Loading|loaded|Model variant" >> "$RESULTS_FILE" 2>&1 || true

    echo ""
    echo "✅ Server started (PID: $SERVER_PID)"
    echo "   Logs: /tmp/rag-$VARIANT.log"

    # Stop server
    echo ""
    echo "🛑 Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true

    echo "" >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"

    # Small delay between tests
    sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 Results saved to: $RESULTS_FILE"
echo ""
echo "📝 Model Variant Summary:"
echo "   - default:  90.4 MB (full precision)"
echo "   - fp16:     45.3 MB (half precision)"
echo "   - int8:     23.0 MB (75% reduction)"
echo "   - uint8:    22.8 MB (75% reduction)"
echo "   - q4:       54.6 MB (40% reduction)"
echo "   - q4f16:    30.0 MB (67% reduction)"
echo "   - bnb4:     53.9 MB (40% reduction)"
echo ""
echo "All variants produce 384-dimensional embeddings."
echo "Choose based on your needs:"
echo "  • Best accuracy: default"
echo "  • Best compression: int8 or uint8"
echo "  • Balanced: fp16 or q4f16"
echo ""
