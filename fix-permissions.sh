#!/bin/bash
echo "🔧 Fixing DKG Node Permissions..."

# Get current user
USER=$(whoami)
GROUP=$(id -gn)

echo "Changing ownership of dkg-node to $USER:$GROUP..."
sudo chown -R $USER:$GROUP agentdao/dkg-node/

echo "✅ Permissions fixed."
