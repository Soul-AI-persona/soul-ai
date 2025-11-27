// create-digital-soul.js

import DkgClient from 'dkg.js';

console.log('Imported DkgClient:', DkgClient);
console.log('Type of DkgClient:', typeof DkgClient);

// --- CONFIGURATION ---
const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 
const CREATOR_ADDRESS = '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E'; 

// --- DIGITAL SOUL REGISTRY ASSET (SOUL AI DATA MODEL) ---
const digitalSoulAsset = {
    // ⚠️ Custom Context URL
    '@context': 'http://schema.org', 
    '@id': `soul:ai:${Date.now()}`, 
    '@type': 'DigitalSoul',
    
    // Core Identity Fields
    creator: CREATOR_ADDRESS,
    name: "CryptoCaseySoul",
    soulTraits: ["wise", "technical", "balanced"],
    creationTimestamp: new Date().toISOString(),
    
    // Initial State of the Soul's Lifetime Memory and Reputation
    soulMemory: {
        totalInteractions: 0,
        crossPlatformPresence: ["twitter"],
        lifetimeReputation: 0.0,
        soulAge: "0 days" 
    },
    
    // Initial State of the Economic Soul
    economicSoul: {
        soulBoundTokens: "0 SOUL",
        lifetimeEarnings: "0 USDC",
        soulStakes: ["none"]
    },
    
    useCase: "defi_education",
    specializations: ["yield_farming", "risk_analysis"]
};


async function createDigitalSoul() {
    console.log(`🚀 Creating Digital Soul: ${digitalSoulAsset.name}`);
    
    // 1. Initialize DKG Client with the custom parameters
    const dkg = new DkgClient({ 
        endpoint: DKG_NODE_URL,
        blockchain: {
            name: 'otp:20430',
            publicKey: CREATOR_ADDRESS,
            privateKey: WALLET_PRIVATE_KEY,
        },
        maxNumberOfRetries: 30,
        frequency: 2,
        contentType: 'all',
        nodeId: 'atomic-shield-160',
    });

    try {
        // 2. Execute the publication transaction
        // FIX: Replaced the undefined variable 'content' with the defined variable 'digitalSoulAsset'
        const result = await dkg.asset.create(digitalSoulAsset, { 
            epochsNum: 2,
            maxNumberOfRetries: 30,
            frequency: 2,
        });

        if (result.UAL) {
            console.log('✅ Digital Soul successfully registered on DKG!');
            console.log(`   Soul Name: ${digitalSoulAsset.name}`);
            console.log(`   UAL: ${result.UAL}`);
        } else {
            console.error('❌ DKG Soul Registration Failed (No UAL returned).');
            console.error('Operation Result:', JSON.stringify(result.operation, null, 2));
            console.log('--- ACTION REQUIRED ---');
            console.log('The operation likely started but timed out. Please check DKG Node logs for the final UAL/Asset Storage Hash.');
        }
        
    } catch (error) {
        console.error('❌ DKG Soul Registration Failed:', error);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('--- TROUBLESHOOTING ---');
        console.log('1. Is your DKG Node running?');
        console.log('2. Is the DKG Node URL correct? (http://localhost:8900 might be required)');
    }
}

// Execute the function
createDigitalSoul();