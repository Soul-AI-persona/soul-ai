// NEW (Corrected) Import Syntax for CommonJS modules:
import DkgClient from 'dkg.js';

console.log('Imported DkgClient:', DkgClient);
console.log('Type of DkgClient:', typeof DkgClient);

// ⚠️ REPLACE THIS LINE with the actual private key you copied from the .env file
// I have used your key but prefixed it with '0x' for safety.
const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 

const DKG_NODE_URL = 'http://localhost'; 

// --- SCHEMA DEFINITION: The data for one verified piece of work ---
const contributionData = {
    '@context': 'http://schema.org', 
    '@id': `uuid:Contribution-${Date.now()}`, // Unique ID for this contribution
    '@type': 'Contribution',
    
    // Core verifiable fields for AgentDAO
    contributorWalletAddress: '0xABCDE...TheUserWhoDidTheWork...12345', 
    taskID: 'AGD-TASK-1002',
    taskDescription: 'Finalized the governance rules documentation.',
    status: 'Verified', 
    verificationAgentID: 'AgentDAO-Auditor-Beta',
    timestamp: new Date().toISOString()
};

async function publishContribution() {
    // 1. Initialize DKG Client with the wallet and node URL
    const dkg = new DkgClient({ 
        endpoint: DKG_NODE_URL,
        blockchain: {
            name: 'otp:20430',
            publicKey: '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E',
            privateKey: WALLET_PRIVATE_KEY,
        },
        maxNumberOfRetries: 30,
        frequency: 2,
        contentType: 'all',
        nodeId: 'atomic-shield-160',
    });

    console.log(`Publishing Contribution for task: ${contributionData.taskID}`);

    try {
        // 2. Execute the publication transaction
    const result = await dkg.asset.create(content, {
      epochsNum: 2,
      maxNumberOfRetries: 30,
      frequency: 2,
    });        if (result.UAL) {
            console.log('✅ Contribution KA successfully published to DKG!');
            console.log(`   UAL: ${result.UAL}`);
        } else {
            console.error('❌ DKG Publication Failed (No UAL returned).');
            console.error('Operation Result:', JSON.stringify(result.operation, null, 2));
        }
        
    } catch (error) {
        console.error('❌ DKG Publication Failed:', error);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('--- TROUBLESHOOTING ---');
        console.log('1. Is your DKG Node running? Run `npm run start:engine` in the `dkg-node` folder.');
        console.log('2. Does the wallet (private key) have enough testnet TRAC tokens?');
        console.log('3. Is the DKG Node URL correct? (http://localhost:8900)');
    }
}

publishContribution();