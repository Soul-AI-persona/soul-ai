import express from 'express';
import cors from 'cors';
import crypto from 'crypto'; // Used for generating mock UALs
import DkgClient from 'dkg.js';
import { postToSocial } from './services/socialService.js';

const app = express();
const PORT = 3000;

// --- DKG CONFIGURATION ---
const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 
const DKG_PORT = 8900;
const CREATOR_ADDRESS = '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E'; 

// Initialize DKG Client
const dkg = new DkgClient({ 
    endpoint: DKG_NODE_URL,
    port: DKG_PORT,
    blockchain: {
        name: 'otp:20430',
        publicKey: CREATOR_ADDRESS,
        privateKey: WALLET_PRIVATE_KEY,
    },
    maxNumberOfRetries: 60, // Increased from 30 to give more time
    frequency: 5,           // Increased from 2 to check less frequently but for longer total duration
    contentType: 'all',
    nodeId: 'atomic-shield-160',
});

// Middleware Setup
app.use(cors()); // Allow the React frontend (running on a different port) to access this server
app.use(express.json()); // To parse JSON bodies from the frontend

// --- MOCK DKG STATE & REPUTATION DATABASE ---
// In a real application, this data would live in a database and be calculated 
// by querying the DKG for Knowledge Assets linked to the Soul.

const DKG_REPUTATION_DB = {
    // Custom souls are added dynamically here
};

// --- CORE DKG INTEGRATION SIMULATION FUNCTIONS ---

/**
 * 🧠 Knowledge Layer: Creates and simulates publishing a Memory Fragment (Knowledge Asset) to the DKG.
 * @param {string} ual - Universal Asset Locator of the Soul performing the task.
 * @param {object} taskPayload - The task details from the user.
 * @param {string} llmResponse - The simulated result of the AI agent's work.
 * @returns {object} The structured JSON-LD Knowledge Asset (Memory Fragment).
 */
const publishMemoryFragmentToDKG = async (ual, taskPayload, llmResponse) => {
    const assetId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const memoryFragment = {
        "@context": "https://schema.org",
        "@id": `asset:dkg:${assetId}`,
        "@type": "MemoryFragment", // Custom type for agent verifiable data
        "creatorUAL": ual,
        "dateCreated": timestamp,
        "taskType": taskPayload.taskType,
        "taskPrompt": taskPayload.taskPayload.topic || taskPayload.taskPayload.content, // Handle both chat and social post payloads
        "verifiableResult": llmResponse, // The result the agent is accountable for
        "verificationMetadata": {
            "attestationPlatform": "SOUL_AI_DASHBOARD",
            "crossChainReference": "PENDING_DKG_PUBLICATION" 
        }
    };
    
    console.log(`\n[🧠 DKG Publish] Publishing Memory Fragment for ${ual}. Asset ID: ${assetId}`);
    
    try {
        const result = await dkg.asset.create(memoryFragment, { 
            epochsNum: 2,
            maxNumberOfRetries: 60,
            frequency: 5,
        });

        if (result.UAL) {
            console.log(`✅ Memory Fragment successfully published to DKG! UAL: ${result.UAL}`);
            memoryFragment.dkgUAL = result.UAL; // Attach the real UAL to the response
            return memoryFragment;
        } else {
            console.error('❌ DKG Publication Failed (No UAL returned).');
            throw new Error('DKG Publication Failed');
        }
    } catch (error) {
        console.error('❌ DKG Publication Error:', error);
        // Fallback for demo purposes if DKG is down, but mark as failed
        memoryFragment.dkgError = error.message;
        return memoryFragment;
    }
};

/**
 * 🔗 Trust Layer: Simulates the reputation update based on the agent's action.
 * In a real scenario, this involves complex calculations over time.
 */
const updateSoulReputation = (ual, taskType) => {
    const previousScore = DKG_REPUTATION_DB[ual] || 0.00;
    let scoreChange = 0.05 + Math.random() * 0.15; // Random increase

    // Different tasks could impact different reputation metrics
    if (taskType === 'fact_checking') {
        scoreChange *= 1.5; // Fact-checking has higher trust impact
    }
    
    const newScore = Math.min(5.00, previousScore + scoreChange); // Cap at 5.00
    DKG_REPUTATION_DB[ual] = newScore;

    console.log(`[🔗 Trust Layer] Reputation Update: ${previousScore.toFixed(2)} -> ${newScore.toFixed(2)}`);
    // CRITICAL: This is where you would use the DKG Node SDK (or x402 protocol) 
    // to write the reputation update to the blockchain/trust layer.

    return { previousScore, newScore };
};


// --- API ENDPOINTS (Agent Layer UI Orchestration) ---

// 1. Get current status/score
app.get('/api/soul/status/:ual', async (req, res) => {
    const { ual } = req.params;
    
    // Default fallback from local DB
    let score = DKG_REPUTATION_DB[ual] !== undefined ? DKG_REPUTATION_DB[ual] : 0.00;
    let status = 'Active';

    // If it looks like a real DKG UAL (did:dkg:...), try to fetch it
    if (ual.startsWith('did:dkg:')) {
        console.log(`[🔍 DKG Read] Fetching Soul state for: ${ual}`);
        try {
            const result = await dkg.asset.get(ual);
            // Robust JSON-LD parsing
            const assertionData = result.assertion || result;
            let soulData;
            
            if (Array.isArray(assertionData)) {
                soulData = assertionData.find(obj => obj['@type'] && obj['@type'].includes('DigitalSoul'));
            } else {
                soulData = assertionData;
            }

            if (soulData && soulData.soulMemory) {
                const memory = Array.isArray(soulData.soulMemory) ? soulData.soulMemory[0] : soulData.soulMemory;
                if (memory.lifetimeReputation) {
                    const rep = memory.lifetimeReputation;
                    // Handle value object wrapper if present
                    if (typeof rep === 'object' && rep['@value']) {
                        score = parseFloat(rep['@value']);
                    } else {
                        score = parseFloat(rep);
                    }
                    console.log(`   ✅ Verified Reputation from DKG: ${score}`);
                }
            }
        } catch (error) {
            console.warn(`   ⚠️ Failed to fetch/parse DKG asset. Using cached/default score. Error: ${error.message}`);
            status = 'Syncing/Offline';
        }
    }
    
    return res.json({
        ual: ual,
        status: status,
        score: score
    });
});

// 2. Create a new Digital Soul
app.post('/api/soul/create', async (req, res) => {
    const { name, type, purpose, traits, communicationStyle, sources, platform, responsibilities, stakeAmount } = req.body;
    
    console.log(`\n[✨ Soul Creation] Initializing creation for: ${name}`);

    // Construct the Digital Soul JSON-LD Asset
    const digitalSoulAsset = {
        '@context': 'http://schema.org', 
        '@id': `soul:ai:${Date.now()}`, 
        '@type': 'DigitalSoul',
        
        // Core Identity Fields
        creator: CREATOR_ADDRESS,
        name: name,
        soulType: type,
        description: purpose,
        soulTraits: traits,
        communicationStyle: communicationStyle,
        creationTimestamp: new Date().toISOString(),
        
        // Operational Config
        knowledgeSources: sources,
        primaryPlatform: platform,
        responsibilities: responsibilities,
        
        // Initial State
        soulMemory: {
            totalInteractions: 0,
            lifetimeReputation: 0.0,
            soulAge: "0 days" 
        },
        
        // Economic Soul
        economicSoul: {
            soulBoundTokens: `${stakeAmount} SOUL`,
            lifetimeEarnings: "0 USDC",
            soulStakes: ["initial_stake"]
        }
    };

    try {
        console.log("   📡 Publishing Soul to DKG...");
        const result = await dkg.asset.create(digitalSoulAsset, { 
            epochsNum: 2,
            maxNumberOfRetries: 60, // Increased timeout
            frequency: 5,
        });

        if (result.UAL) {
            console.log(`   ✅ Soul Created! UAL: ${result.UAL}`);
            
            // In a real app, we would save this UAL to a local DB to track user's souls
            // For now, we return it to the frontend to store in Context
            
            return res.json({
                success: true,
                message: 'Digital Soul created successfully on DKG.',
                soul: {
                    id: result.UAL,
                    name: name,
                    type: type,
                    purpose: purpose,
                    traits: traits,
                    platforms: [platform],
                    stats: { score: 0, earnings: 0, followers: 0 }
                }
            });
        } else {
            console.error('❌ DKG returned result without UAL:', JSON.stringify(result, null, 2));
            throw new Error('DKG Publication Failed: No UAL returned. The node may be unable to replicate to the network.');
        }
    } catch (error) {
        console.error('❌ Soul Creation Failed:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. Execute a task on the Soul Agent
app.post('/api/soul/execute-task', async (req, res) => {
    // 🤖 Agent Layer: Receives command from UI
    const { soulUAL, taskType, taskPayload } = req.body;

    if (soulUAL.includes("custom_") && DKG_REPUTATION_DB[soulUAL] === undefined) {
        // Initialize new custom soul in the database
        DKG_REPUTATION_DB[soulUAL] = 0.00;
    }

    console.log(`\n[🤖 Agent Layer] Executing task "${taskType}" for Soul: ${soulUAL}`);
    
    let llmResponse;
    let socialResult = null;

    if (taskType === 'social_post') {
        const { content, platform } = taskPayload;
        console.log(`   📢 Posting to ${platform}: "${content}"`);
        
        try {
            socialResult = await postToSocial(platform, content);
            llmResponse = `Posted to ${platform}. ID: ${socialResult.platformId}`;
        } catch (err) {
            llmResponse = `Failed to post to ${platform}: ${err.message}`;
        }
    } else {
        console.log(`Prompt: ${taskPayload.topic}`);
        // --- 1. Simulate AI/LLM Reasoning (Agent Action) ---
        llmResponse = `Mock response generated for: "${taskPayload.topic}". This output is the agent's verifiable action.`;
    }

    // --- 2. Publish to DKG (Knowledge Layer Interaction) ---
    const memoryFragment = await publishMemoryFragmentToDKG(soulUAL, req.body, llmResponse);

    // --- 3. Update Reputation (Trust Layer Interaction) ---
    const reputationUpdate = updateSoulReputation(soulUAL, taskType);

    // Send successful response back to the frontend
    res.json({
        message: 'Task executed, Memory Fragment published, and DKG score updated.',
        soulUAL,
        result: llmResponse,
        memoryFragment,
        reputationUpdate
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('--------------------------------------------------');
    console.log(`Agent Framework Server running on port ${PORT}`);
    console.log('--------------------------------------------------');
    console.log('Ensure your DKG Edge Node is also running locally.');
    console.log('DKG Reputation DB initialized:', DKG_REPUTATION_DB);
    console.log('--------------------------------------------------');
});