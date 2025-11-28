// reputation-oracle.js
// Autonomous Reputation Oracle: Computes and publishes verifiable reputation scores to DKG

import DkgClient from 'dkg.js';

const WALLET_PRIVATE_KEY = '0xd940e2826ff2175906e69fd146ed5fb609d60b8f4e1ec8323df3bfe19bfa744d';
const DKG_NODE_URL = 'http://localhost';
const SOUL_UAL = 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/405822';

// Social Graph (simulated - in production, fetch from Twitter API, Discord, etc.)
const socialGraph = {
  'alice': { followers: 1000, stake: 50, following: ['bob', 'charlie'] },
  'bob': { followers: 500, stake: 25, following: ['alice', 'david'] },
  'charlie': { followers: 200, stake: 10, following: ['alice'] },
  'david': { followers: 100, stake: 5, following: ['bob', 'charlie'] },
};

/**
 * PageRank Algorithm: Compute reputation from social graph structure
 * @param {Object} graph - Social graph with nodes and edges
 * @param {number} damping - Damping factor (0.85 is standard)
 * @param {number} iterations - Number of iterations for convergence
 * @returns {Object} - PageRank scores for each node
 */
function computePageRank(graph, damping = 0.85, iterations = 10) {
  const nodes = Object.keys(graph);
  let ranks = {};
  
  // Initialize ranks
  nodes.forEach(node => {
    ranks[node] = 1 / nodes.length;
  });

  // Iterate to convergence
  for (let iter = 0; iter < iterations; iter++) {
    let newRanks = {};
    
    nodes.forEach(node => {
      let rank = (1 - damping) / nodes.length;
      
      // Find all nodes that link TO this node
      nodes.forEach(source => {
        if (graph[source].following && graph[source].following.includes(node)) {
          rank += damping * (ranks[source] / graph[source].following.length);
        }
      });
      
      newRanks[node] = rank;
    });
    
    ranks = newRanks;
  }

  return ranks;
}

/**
 * Sybil-Resistant Reputation: Combine PageRank with token stake weighting
 * @param {Object} graph - Social graph
 * @param {Object} pageRanks - PageRank scores
 * @returns {Object} - Final reputation scores (0-100 scale)
 */
function computeSybilResistantReputation(graph, pageRanks) {
  const reputation = {};
  const totalStake = Object.values(graph).reduce((sum, node) => sum + node.stake, 0);

  Object.keys(graph).forEach(node => {
    const pageRankScore = pageRanks[node] || 0;
    const stakeWeight = graph[node].stake / totalStake;
    
    // Weighted combination: 60% graph structure, 40% economic stake
    const combinedScore = (pageRankScore * 0.6 + stakeWeight * 0.4) * 100;
    
    reputation[node] = Math.round(combinedScore * 100) / 100; // 2 decimal places
  });

  return reputation;
}

/**
 * Main: Compute and publish reputation scores to DKG
 */
async function publishReputationOracle() {
  console.log('🔍 Autonomous Reputation Oracle Starting...\n');

  // 1. Compute PageRank
  console.log('📊 Computing PageRank from social graph...');
  const pageRanks = computePageRank(socialGraph);
  console.log('PageRank Scores:', pageRanks);

  // 2. Compute Sybil-Resistant Reputation
  console.log('\n🛡️ Computing Sybil-resistant reputation...');
  const reputationScores = computeSybilResistantReputation(socialGraph, pageRanks);
  console.log('Reputation Scores:', reputationScores);

  // 3. Create DKG Knowledge Asset
  const reputationAsset = {
    '@context': {
      '@vocab': 'http://schema.org/',
      'rep': 'https://reputation-oracle.io/context/v1#',
      'pageRank': { '@id': 'rep:pageRank' },
      'reputationScore': { '@id': 'rep:reputationScore' },
      'stake': { '@id': 'rep:stake' },
      'sybilResistant': { '@id': 'rep:sybilResistant' },
    },
    '@id': `oracle:reputation:${Date.now()}`,
    '@type': 'ReputationOracle',
    name: 'CryptoCaseyReputation Oracle',
    description: 'Sybil-resistant reputation computed from social graph structure and economic stake',
    timestamp: new Date().toISOString(),
    algorithm: 'PageRank + Stake-Weighted Reputation',
    sybilResistant: true,
    scores: reputationScores,
    methodology: {
      pageRankDampingFactor: 0.85,
      graphWeighting: 0.6,
      stakeWeighting: 0.4,
      iterations: 10,
    },
    publishedBy: SOUL_UAL,
    trustScore: 0.95, // How much can be trusted (based on node reputation)
    verifiable: true, // Can be verified on-chain
  };

  // 4. Publish to DKG
  console.log('\n📤 Initializing DKG Client...');
  const dkg = new DkgClient({
    endpoint: DKG_NODE_URL,
    port: 8900,
    blockchain: {
      name: 'otp:20430',
      publicKey: '0xCf3c92e6A8147b1F786bEeCcF33b5E0F50D4E46E',
      privateKey: WALLET_PRIVATE_KEY,
    },
    maxNumberOfRetries: 60,
    frequency: 5,
    contentType: 'all',
    nodeId: 'atomic-shield-160',
  });

  try {
    console.log('\n🚀 Publishing reputation scores to DKG...');
    const result = await dkg.asset.create(reputationAsset, {
      epochsNum: 2,
      maxNumberOfRetries: 60,
      frequency: 5,
    });

    if (result.UAL) {
      console.log('\n✅ Reputation Oracle Successfully Published!');
      console.log(`   Oracle UAL: ${result.UAL}`);
      console.log(`   Publish Status: ${result.publish?.status || 'PUBLISHED'}`);
      console.log('\n📊 Reputation Scores Available:');
      Object.entries(reputationScores).forEach(([user, score]) => {
        console.log(`   ${user}: ${score}/100`);
      });
      console.log('\n💡 Use Cases:');
      console.log('   - Trust feeds: Filter by reputation threshold');
      console.log('   - Data APIs: Gate access with x402 micropayments');
      console.log('   - E-commerce: Verify seller/buyer reputation');
      console.log('   - Governance: Weight voting by reputation');
    } else {
      console.error('❌ Publication Failed - No UAL returned');
      console.error('Operation Result:', JSON.stringify(result.operation, null, 2));
    }
  } catch (error) {
    console.error('❌ Reputation Oracle Publication Failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Execute the oracle
publishReputationOracle();
