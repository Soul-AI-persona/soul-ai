import DkgClient from 'dkg.js';

// --- CONFIGURATION ---
// In a production environment, these should be in .env
const CONFIG = {
    WALLET_PRIVATE_KEY: '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d',
    DKG_NODE_URL: 'http://localhost',
    CREATOR_ADDRESS: '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E',
    // Default to the latest known UAL from economic-agent.js
    DIGITAL_SOUL_UAL: 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404756',
    NODE_ID: 'atomic-shield-160',
    REPUTATION_THRESHOLD: 0.5,
    SOUL_TOKEN_AMOUNT: 500
};

// Helper to initialize the DKG Client
const getDkgClient = () => {
    return new DkgClient({
        endpoint: CONFIG.DKG_NODE_URL,
        blockchain: {
            name: 'otp:20430',
            publicKey: CONFIG.CREATOR_ADDRESS,
            privateKey: CONFIG.WALLET_PRIVATE_KEY,
        },
        maxNumberOfRetries: 30,
        frequency: 2,
        contentType: 'all',
        nodeId: CONFIG.NODE_ID,
    });
};

/**
 * Records a new memory fragment to the DKG
 * @param {Object} memoryDetails - { description, accuracyScore, tags }
 */
export const recordMemory = async (memoryDetails) => {
    const dkg = getDkgClient();
    
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
        description: memoryDetails.description || "Recorded interaction details.",
        memoryType: "interaction",
        timestamp: new Date().toISOString(),
        digitalSoul: CONFIG.DIGITAL_SOUL_UAL,
        accuracyScore: memoryDetails.accuracyScore || 0.95
    };

    console.log(`[API] Recording Memory: ${memoryData['@id']}`);

    try {
        const result = await dkg.asset.create(memoryData, {
            epochsNum: 2,
            maxNumberOfRetries: 120,
            frequency: 5,
        });

        if (result.UAL) {
            console.log(`[API] Memory recorded: ${result.UAL}`);
            return { success: true, ual: result.UAL };
        } else {
            throw new Error('No UAL returned from DKG');
        }
    } catch (error) {
        console.error('[API] Memory Recording Failed:', error);
        throw error;
    }
};

/**
 * Calculates the reputation score based on memories and updates the Soul asset
 */
export const calculateReputation = async () => {
    const dkg = getDkgClient();
    console.log(`[API] Calculating Reputation for: ${CONFIG.DIGITAL_SOUL_UAL}`);

    try {
        // 1. SPARQL Query
        const sparqlQuery = `
            PREFIX sa: <https://soulai.org/context/v1#>
            SELECT ?fragment ?accuracy
            WHERE {
                ?fragment a sa:MemoryFragment .
                ?fragment sa:digitalSoul <${CONFIG.DIGITAL_SOUL_UAL}> .
                ?fragment sa:accuracyScore ?accuracy .
            }
        `;

        const queryResult = await dkg.graph.query(sparqlQuery, 'SELECT');
        
        let totalAccuracy = 0;
        let fragmentCount = 0;
        const bindings = queryResult.data || [];

        if (bindings.length > 0) {
            bindings.forEach(binding => {
                let accuracyVal = binding.accuracy;
                if (typeof accuracyVal === 'object' && accuracyVal.value) {
                    accuracyVal = accuracyVal.value;
                }
                if (typeof accuracyVal === 'string') {
                    accuracyVal = accuracyVal.replace(/^"|"$/g, '').split('^^')[0];
                }
                const accuracy = parseFloat(accuracyVal);
                if (!isNaN(accuracy)) {
                    totalAccuracy += accuracy;
                    fragmentCount++;
                }
            });
        }

        const newReputationScore = fragmentCount > 0 ? (totalAccuracy / fragmentCount) : 0;
        console.log(`[API] Calculated Score: ${newReputationScore} from ${fragmentCount} fragments`);

        // 2. Fetch and Update Soul
        const soulAssetResult = await dkg.asset.get(CONFIG.DIGITAL_SOUL_UAL);
        const assertionData = soulAssetResult.assertion || soulAssetResult;
        
        let fetchedSoulObject;
        if (Array.isArray(assertionData)) {
            fetchedSoulObject = assertionData.find(obj => obj['@type'] && obj['@type'].includes('DigitalSoul')); // simplified check
            if (!fetchedSoulObject) {
                 // Fallback: check for schema.org/DigitalSoul
                 fetchedSoulObject = assertionData.find(obj => obj['@type'] && obj['@type'].includes('DigitalSoul'));
            }
        } else {
            fetchedSoulObject = assertionData;
        }

        if (!fetchedSoulObject) {
            // If we can't find the object, we can't update it safely.
            // However, for the demo, we might want to return the score anyway.
            console.warn('[API] Could not find DigitalSoul object to update. Returning score only.');
            return { 
                newScore: newReputationScore, 
                fragmentCount, 
                updated: false,
                message: "Score calculated but Asset update skipped (Soul object not found in fetch)"
            };
        }

        const fetchedSoulId = fetchedSoulObject['@id'];

        // Construct updated asset
        const updatedSoulAsset = {
            '@context': 'http://schema.org', 
            '@id': fetchedSoulId, 
            '@type': 'DigitalSoul',
            creator: CONFIG.CREATOR_ADDRESS,
            name: fetchedSoulObject.name || "CryptoCaseySoul",
            soulTraits: fetchedSoulObject.soulTraits || ["wise", "technical", "balanced"],
            creationTimestamp: new Date().toISOString(),
            
            soulMemory: {
                totalInteractions: fragmentCount,
                crossPlatformPresence: ["twitter"],
                lifetimeReputation: newReputationScore,
                soulAge: "1 days"
            },
            
            economicSoul: fetchedSoulObject.economicSoul || {
                soulBoundTokens: "0 SOUL",
                lifetimeEarnings: "0 USDC",
                soulStakes: ["none"]
            },
            
            useCase: fetchedSoulObject.useCase || "defi_education",
            specializations: fetchedSoulObject.specializations || ["yield_farming", "risk_analysis"]
        };

        // 3. Publish Update
        const publishResult = await dkg.asset.create(updatedSoulAsset, { 
            epochsNum: 2,
            maxNumberOfRetries: 120,
            frequency: 5,
        });

        if (publishResult.UAL) {
            console.log(`[API] Soul Updated: ${publishResult.UAL}`);
            // Update our local config UAL for subsequent calls in this session (optional, but good for consistency)
            CONFIG.DIGITAL_SOUL_UAL = publishResult.UAL;
            
            return { 
                newScore: newReputationScore, 
                fragmentCount, 
                updated: true, 
                ual: publishResult.UAL 
            };
        } else {
            throw new Error('Failed to publish updated Soul asset');
        }

    } catch (error) {
        console.error('[API] Calculate Reputation Failed:', error);
        throw error;
    }
};

/**
 * Checks the economic status of the Soul
 */
export const getSoulStatus = async (passedUAL) => {
    const dkg = getDkgClient();
    const targetUAL = passedUAL || CONFIG.DIGITAL_SOUL_UAL;
    console.log(`[API] Checking Status for: ${targetUAL}`);

    try {
        let soulData;
        let currentScore = 0;

        try {
            const soulAssetResult = await dkg.asset.get(targetUAL);
            const assertionData = soulAssetResult.assertion || soulAssetResult;
            
            if (Array.isArray(assertionData)) {
                soulData = assertionData.find(obj => obj['@type'] && obj['@type'].includes('DigitalSoul'));
            } else {
                soulData = assertionData;
            }
        } catch (e) {
            console.warn("[API] Fetch failed, using mock data for demo resilience");
            soulData = { soulMemory: { lifetimeReputation: 0.0 } };
        }

        if (soulData && soulData.soulMemory) {
             const memory = Array.isArray(soulData.soulMemory) ? soulData.soulMemory[0] : soulData.soulMemory;
             if (memory.lifetimeReputation) {
                 const rep = memory.lifetimeReputation;
                 if (typeof rep === 'object' && rep['@value']) {
                     currentScore = parseFloat(rep['@value']);
                 } else {
                     currentScore = parseFloat(rep);
                 }
             }
        }

        const isEligible = currentScore >= CONFIG.REPUTATION_THRESHOLD;
        
        return {
            ual: CONFIG.DIGITAL_SOUL_UAL,
            reputationScore: currentScore,
            eligibleForRewards: isEligible,
            stakedAmount: isEligible ? CONFIG.SOUL_TOKEN_AMOUNT : 0,
            status: isEligible ? "Active & Earning" : "Building Reputation"
        };

    } catch (error) {
        console.error('[API] Get Status Failed:', error);
        throw error;
    }
};

/**
 * Retrieves memories (interactions) for a specific Soul
 */
export const getMemories = async (passedUAL) => {
    const dkg = getDkgClient();
    const targetUAL = passedUAL || CONFIG.DIGITAL_SOUL_UAL;
    console.log(`[API] Fetching Memories for: ${targetUAL}`);

    try {
        const sparqlQuery = `
            PREFIX sa: <https://soulai.org/context/v1#>
            PREFIX schema: <http://schema.org/>
            SELECT ?fragment ?name ?description ?accuracy ?timestamp
            WHERE {
                ?fragment a sa:MemoryFragment .
                ?fragment sa:digitalSoul <${targetUAL}> .
                ?fragment sa:accuracyScore ?accuracy .
                OPTIONAL { ?fragment schema:name ?name } .
                OPTIONAL { ?fragment schema:description ?description } .
                OPTIONAL { ?fragment schema:dateCreated ?timestamp } .
            }
            LIMIT 20
        `;

        const queryResult = await dkg.graph.query(sparqlQuery, 'SELECT');
        const bindings = queryResult.data || [];
        
        return bindings.map(b => ({
            ual: b.fragment ? b.fragment.value : null,
            name: b.name ? b.name.value : "Unknown Memory",
            description: b.description ? b.description.value : "",
            accuracy: b.accuracy ? parseFloat(b.accuracy.value) : 0,
            timestamp: b.timestamp ? b.timestamp.value : null
        }));

    } catch (error) {
        console.error('[API] Get Memories Failed:', error);
        // Return empty array instead of throwing to keep UI stable
        return [];
    }
};
