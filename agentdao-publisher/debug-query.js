
import DkgClient from 'dkg.js';

const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 

async function main() {
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

    const query = `
    PREFIX schema: <http://schema.org/>
    SELECT ?s ?p ?o
    WHERE {
      ?s ?p ?o .
      FILTER (regex(str(?s), "soul:memory"))
    }
    LIMIT 10
    `;

    console.log("Running SPARQL query...");
    try {
        const result = await dkg.graph.query(query, 'SELECT');
        console.log('Query Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error querying graph:", e);
    }
}

main();
