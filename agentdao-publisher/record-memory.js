import DkgClient from 'dkg.js';

console.log('Imported DkgClient:', DkgClient);
console.log('Type of DkgClient:', typeof DkgClient);

const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 

// --- SCHEMA DEFINITION: The data for a memory record ---
const memoryData = {
    '@context': {
        '@vocab': 'http://schema.org/',
        'sa': 'https://soulai.org/context/v1#',
        'digitalSoul': { '@id': 'sa:digitalSoul', '@type': '@id' },
        'accuracyScore': { '@id': 'sa:accuracyScore' },
        'MemoryFragment': 'sa:MemoryFragment'
    },
    '@id': `uuid:Memory-${Date.now()}`, 
    '@type': 'MemoryFragment',
    name: "Agent Interaction Memory",
    description: "Recorded interaction details for future recall.",
    memoryType: "interaction",
    timestamp: new Date().toISOString(),
    digitalSoul: 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404719',
    accuracyScore: 0.95
};

async function recordMemory() {
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

    console.log(`Recording Memory: ${memoryData.name}`);

    try {
        // 2. Execute the publication transaction
        const result = await dkg.asset.create(memoryData, {
            epochsNum: 2,
            maxNumberOfRetries: 120,
            frequency: 5,
        });

        if (result.UAL) {
            console.log('✅ Memory successfully recorded to DKG!');
            console.log(`   UAL: ${result.UAL}`);
        } else {
            console.error('❌ Memory Recording Failed (No UAL returned).');
            console.error('Operation Result:', JSON.stringify(result.operation, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Memory Recording Failed:', error);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

recordMemory();
