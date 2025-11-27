
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

    const content = {
        public: {
            "@context": "http://schema.org",
            "@type": "Person",
            "name": "Test Write",
            "description": "Testing write capability"
        }
    };

    console.log("Publishing test asset...");
    try {
        const result = await dkg.asset.create(content, {
            keywords: ['Test'],
            visibility: 'public',
            epochsNum: 2
        });
        console.log('Publish Result:', JSON.stringify(result, null, 2));
        
        const UAL = result.UAL;
        console.log(`Waiting 10s before fetch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log(`Fetching ${UAL}...`);
        const getResult = await dkg.asset.get(UAL);
        console.log('Get Result:', JSON.stringify(getResult, null, 2));
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
