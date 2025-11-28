#!/bin/bash
echo "🛑 Stopping DKG Services..."

# Kill processes on specific ports
echo "Killing process on port 8900 (DKG Node)..."
fuser -k 8900/tcp

echo "Killing process on port 9999 (Blazegraph)..."
fuser -k 9999/tcp

echo "Killing process on port 9200 (DKG Agent)..."
fuser -k 9200/tcp

echo "Killing process on port 3000 (Backend)..."
fuser -k 3000/tcp

echo "✅ All services stopped."
