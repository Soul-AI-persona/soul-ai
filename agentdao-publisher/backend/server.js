import express from 'express';
import cors from 'cors';
import crypto from 'crypto'; // Used for generating mock UALs
const app = express();
const PORT = 3000;

// Middleware Setup
app.use(cors()); // Allow the React frontend (running on a different port) to access this server
app.use(express.json()); // To parse JSON bodies from the frontend

// --- MOCK DKG STATE & REPUTATION DATABASE ---
// In a real application, this data would live in a database and be calculated 
// by querying the DKG for Knowledge Assets linked to the Soul.

const DKG_REPUTATION_DB = {
    "soul:ai:cryptocasey_edu": 4.50,
    "soul:ai:fact_checker_A": 3.85
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
const publishMemoryFragmentToDKG = (ual, taskPayload, llmResponse) => {
    // CRITICAL: This is where you would use the DKG Node SDK (e.g., @origintrail/dkg-node) 
    // to perform the actual publish command, resulting in a verifiable Knowledge Asset on NeuroWeb.

    const assetId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const memoryFragment = {
        "@context": "https://schema.org",
        "@id": `asset:dkg:${assetId}`,
        "@type": "MemoryFragment", // Custom type for agent verifiable data
        "creatorUAL": ual,
        "dateCreated": timestamp,
        "taskType": taskPayload.taskType,
        "taskPrompt": taskPayload.taskPayload.topic,
        "verifiableResult": llmResponse, // The result the agent is accountable for
        "verificationMetadata": {
            "attestationPlatform": "SOUL_AI_DASHBOARD",
            "crossChainReference": "MOCK_POLKADOT_TX_HASH_0xDKG_NEUROW_789" 
        }
    };
    
    console.log(`\n[🧠 DKG Publish] Publishing Memory Fragment for ${ual}. Asset ID: ${assetId}`);
    // Simulate DKG Node SDK call: await dkg.publish(memoryFragment);

    return memoryFragment;
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
app.get('/api/soul/status/:ual', (req, res) => {
    const { ual } = req.params;
    const score = DKG_REPUTATION_DB[ual] !== undefined ? DKG_REPUTATION_DB[ual] : 0.00;
    
    // Simulate retrieval from the Trust Layer
    return res.json({
        ual: ual,
        status: 'Active',
        score: score
    });
});

// 2. Execute a task on the Soul Agent
app.post('/api/soul/execute-task', async (req, res) => {
    // 🤖 Agent Layer: Receives command from UI
    const { soulUAL, taskType, taskPayload } = req.body;

    if (soulUAL.includes("custom_") && DKG_REPUTATION_DB[soulUAL] === undefined) {
        // Initialize new custom soul in the database
        DKG_REPUTATION_DB[soulUAL] = 0.00;
    }

    console.log(`\n[🤖 Agent Layer] Executing task "${taskType}" for Soul: ${soulUAL}`);
    console.log(`Prompt: ${taskPayload.topic}`);

    // --- 1. Simulate AI/LLM Reasoning (Agent Action) ---
    const llmResponse = `Mock response generated for: "${taskPayload.topic}". This output is the agent's verifiable action.`;

    // --- 2. Publish to DKG (Knowledge Layer Interaction) ---
    const memoryFragment = publishMemoryFragmentToDKG(soulUAL, req.body, llmResponse);

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