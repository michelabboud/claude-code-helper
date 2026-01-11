#!/bin/bash
# Start ChromaDB with persistent storage at ~/db-data/chromadb

cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Start ChromaDB with custom data directory
chroma run --path ~/db-data/chromadb --host localhost --port 8000
