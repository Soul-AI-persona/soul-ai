// calculate-soul-score.js

import DkgClient from 'dkg.js';

// --- CONFIGURATION ---
const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 
const CREATOR_ADDRESS = '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E'; 

// 🔥 THE TARGET SOUL UAL (The Soul we are scoring)
const DIGITAL_SOUL_UAL = 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404719'; 

// --- SOUL SCORE ENGINE LOGIC ---
async function calculateSoulScore() {
    console.log(`\n🧠 Soul Score Engine starting for Soul: ${DIGITAL_SOUL_UAL}`);
    
    const dkg = new DkgClient({ 
        endpoint: DKG_NODE_URL,
        blockchain: {
            name: 'otp:20430',
            publicKey: CREATOR_ADDRESS,
            privateKey: WALLET_PRIVATE_KEY,
        },
        maxNumberOfRetries: 60,
        frequency: 5,
        contentType: 'all',
        nodeId: 'atomic-shield-160',
    });

    try {
        // 1. DKG QUERY: Traverse the graph to find all linked Memory Fragments
        // We use the SPARQL query language for this traversal.
        const sparqlQuery = `
            PREFIX sa: <https://soulai.org/context/v1#>
            SELECT ?fragment ?accuracy
            WHERE {
                ?fragment a sa:MemoryFragment .
                ?fragment sa:digitalSoul <${DIGITAL_SOUL_UAL}> .
                ?fragment sa:accuracyScore ?accuracy .
            }
        `;

        console.log("   🔍 Querying DKG for all linked Memory Fragments...");
        
        // Note: The dkg.query() method signature might vary slightly depending on the dkg.js version.
        // We use the most common form for SPARQL.
        const queryResult = await dkg.graph.query(sparqlQuery, 'SELECT');
        console.log("   🔍 Query Result Raw:", JSON.stringify(queryResult, null, 2));

        let totalAccuracy = 0;
        let fragmentCount = 0;

        // Process the query results
        // DKG v8 returns { data: [...] }
        const bindings = queryResult.data || [];
        
        if (bindings.length > 0) {
            bindings.forEach(binding => {
                // SPARQL results often come as objects with 'value' properties or raw strings
                // Example: "\"0.95\"^^http://www.w3.org/2001/XMLSchema#double"
                let accuracyVal = binding.accuracy;
                if (typeof accuracyVal === 'object' && accuracyVal.value) {
                    accuracyVal = accuracyVal.value;
                }
                
                // Clean up RDF literals if necessary
                if (typeof accuracyVal === 'string') {
                    // Remove quotes and type suffixes
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
        
        console.log(`\n✅ Found ${fragmentCount} memory fragment(s).`);
        console.log(`   Total Accuracy Score: ${totalAccuracy.toFixed(2)}`);
        console.log(`   Calculated Lifetime Reputation: ${newReputationScore.toFixed(4)}`);

        // 2. RETRIEVE & UPDATE: Fetch the original Digital Soul asset
        const soulAssetResult = await dkg.asset.get(DIGITAL_SOUL_UAL);
        // console.log('DEBUG: soulAssetResult:', JSON.stringify(soulAssetResult, null, 2));

        // Find the main DigitalSoul object in the expanded JSON-LD array
        let fetchedSoulObject;
        let fetchedSoulId;
        
        const assertionData = soulAssetResult.assertion || soulAssetResult; // Handle different return structures
        
        if (Array.isArray(assertionData)) {
            fetchedSoulObject = assertionData.find(obj => obj['@type'] && obj['@type'].includes('http://schema.org/DigitalSoul'));
        } else {
            fetchedSoulObject = assertionData;
        }

        if (!fetchedSoulObject) {
            throw new Error('Could not find DigitalSoul object in fetched asset');
        }

        fetchedSoulId = fetchedSoulObject['@id'];
        console.log(`   Found Soul ID: ${fetchedSoulId}`);

        // Reconstruct the asset object for update (using the template structure)
        // We do this to ensure a clean JSON-LD structure for the new version
        const updatedSoulAsset = {
            '@context': 'http://schema.org', 
            '@id': fetchedSoulId, 
            '@type': 'DigitalSoul',
            creator: CREATOR_ADDRESS,
            name: "CryptoCaseySoul",
            soulTraits: ["wise", "technical", "balanced"],
            creationTimestamp: new Date().toISOString(), // Update timestamp for the new version? Or keep original? Let's use new.
            
            soulMemory: {
                totalInteractions: fragmentCount,
                crossPlatformPresence: ["twitter"],
                lifetimeReputation: newReputationScore,
                soulAge: "1 days" // Incrementing for demo purposes
            },
            
            economicSoul: {
                soulBoundTokens: "0 SOUL",
                lifetimeEarnings: "0 USDC",
                soulStakes: ["none"]
            },
            
            useCase: "defi_education",
            specializations: ["yield_farming", "risk_analysis"]
        };
        
        console.log(`   Updating Soul's reputation to: ${newReputationScore.toFixed(4)}`);

        // 4. PUBLISH NEW VERSION: Create a new version of the asset with the updated score
        const publishResult = await dkg.asset.create(updatedSoulAsset, { 
            epochsNum: 2,
            maxNumberOfRetries: 120,
            frequency: 5,
        });

        if (publishResult.UAL) {
            console.log('\n🌟 Digital Soul Reputation successfully UPDATED on DKG!');
            console.log(`   New Asset Version UAL: ${publishResult.UAL}`);
            console.log('   The Soul now carries its verifiable, calculated reputation!');
        } else {
            console.error('❌ Soul Update Failed (No UAL returned).');
            console.error('Operation Result:', JSON.stringify(publishResult, null, 2));
        }

    } catch (error) {
        console.error('❌ Soul Score Engine Failed:', error);
        console.log('--- TROUBLESHOOTING ---');
        console.log('1. Ensure the Memory Fragment was fully finalized on the DKG before running this.');
    }
}

calculateSoulScore();