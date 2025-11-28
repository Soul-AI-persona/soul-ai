
import DkgClient from 'dkg.js';

const DKG_NODE_URL = 'http://localhost';
const DKG_PORT = 8900;

const dkg = new DkgClient({
    endpoint: DKG_NODE_URL,
    port: DKG_PORT,
    blockchain: {
        name: 'otp:20430',
        publicKey: '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E',
        privateKey: '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d',
    },
    maxNumberOfRetries: 5,
    frequency: 1,
    contentType: 'all',
    nodeId: 'atomic-shield-160',
});

async function checkNode() {
    console.log("🔍 Checking DKG Node Connection...");
    try {
        const info = await dkg.node.info();
        console.log("✅ Node Info:", JSON.stringify(info, null, 2));
    } catch (error) {
        console.error("❌ Failed to get Node Info:", error.message);
    }
}

checkNode();
