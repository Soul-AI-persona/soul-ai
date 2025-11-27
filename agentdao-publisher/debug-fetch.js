
import DkgClient from 'dkg.js';

const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d'; 
const DKG_NODE_URL = 'http://localhost'; 

const UAL_OLD = 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404719';
const MEMORY_UAL = 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404756';

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

    console.log(`Fetching OLD UAL: ${UAL_OLD}`);
    try {
        const oldResult = await dkg.asset.get(UAL_OLD);
        console.log('OLD Result:', JSON.stringify(oldResult, null, 2));
    } catch (e) {
        console.error("Error fetching OLD:", e);
    }

    console.log(`Fetching MEMORY UAL: ${MEMORY_UAL}`);
    try {
        const memoryResult = await dkg.asset.get(MEMORY_UAL);
        console.log('MEMORY Result:', JSON.stringify(memoryResult, null, 2));
    } catch (e) {
        console.error("Error fetching MEMORY:", e);
    }
}

main();
