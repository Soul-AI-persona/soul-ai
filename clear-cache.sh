#!/bin/bash
echo "🧹 Clearing DKG Node Cache..."

DATA_DIR="agentdao/dkg-node/dkg-engine/data"

if [ -d "$DATA_DIR/operation_id_cache" ]; then
    echo "Removing operation_id_cache..."
    rm -rf "$DATA_DIR/operation_id_cache/*"
fi

if [ -d "$DATA_DIR/pending_storage_cache" ]; then
    echo "Removing pending_storage_cache..."
    rm -rf "$DATA_DIR/pending_storage_cache/*"
fi

if [ -d "$DATA_DIR/signature_storage_cache" ]; then
    echo "Removing signature_storage_cache..."
    rm -rf "$DATA_DIR/signature_storage_cache/*"
fi

echo "✅ Cache cleared."
