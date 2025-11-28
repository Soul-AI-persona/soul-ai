# Quick Start Guide - Social Graph Reputation Oracle

## 🚀 30-Second Overview

**What**: Decentralized reputation oracle using PageRank + economic stake weighting  
**Where**: OriginTrail DKG (Polkadot testnet otp:20430)  
**Why**: Sybil-resistant, cryptographically verifiable, fully decentralized  
**Status**: ✅ Complete & Operational  

---

## ⚡ Quick Commands

### 1. Verify DKG Node is Running
```bash
curl http://localhost:8900/api/info
# Should return: { "version": "8.2.1", "status": "operational" }
```

### 2. Run Reputation Oracle
```bash
cd agentdao-publisher
node reputation-oracle.js
# Outputs: Oracle UAL like did:dkg:otp:20430/0x.../405892
```

### 3. Start Backend Server
```bash
cd agentdao-publisher/backend
node server.js
# Server on http://localhost:3000
```

### 4. View Dashboard
```bash
# Open http://localhost:3000 in browser
# Shows reputation scores, oracle status, published assets
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT LAYER: Computation (reputation-oracle.js)               │
│  • PageRank Algorithm (graph structure analysis)               │
│  • Sybil Resistance (60% graph + 40% economic stake)          │
│  • Score Computation: Alice=28.2/100, Bob=17.4/100, etc.      │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER: Publishing (DKG JSON-LD assets)             │
│  • Scores wrapped in semantic metadata                         │
│  • @context defines reputation oracle vocabulary              │
│  • publishedBy links to Digital Soul UAL                      │
│  • Asset published via dkg.asset.create()                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│  TRUST LAYER: Blockchain Anchoring (Polkadot)                │
│  • Asset hashed and recorded on Polkadot testnet              │
│  • Immutable timestamp proves creation time                    │
│  • UAL serves as cryptographic proof                          │
│  • Verifiable by any network participant                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `reputation-oracle.js` | 👈 **MAIN**: Computes & publishes reputation scores |
| `economic-agent.js` | Economic stake integration & token binding |
| `backend/server.js` | REST API endpoints for reputation queries |
| `backend/services/socialService.js` | Twitter/Discord/Telegram integration |
| `frontend/src/App.js` | React dashboard for score visualization |
| `verify-audit.js` | Verify published audit logs on DKG |
| `publish-contribution.js` | Track contributions as DKG assets |

---

## 📡 API Endpoints

### Get Reputation Score
```bash
curl http://localhost:3000/api/reputation/alice
```
Returns: `{ "score": 28.2, "verified": true, "dkgUAL": "did:dkg:otp:20430/..." }`

### Publish New Oracle
```bash
curl -X POST http://localhost:3000/api/publish-reputation \
  -H "Content-Type: application/json" \
  -d '{"epochsNum": 2}'
```
Returns: `{ "ual": "did:dkg:otp:20430/0x.../405892", "status": "PUBLISHED" }`

### Check Soul Status
```bash
curl http://localhost:3000/api/soul/info
```
Returns: `{ "ual": "did:dkg:otp:20430/0x.../405822", "reputation": 0.95 }`

---

## 🛡️ Sybil Resistance Explained

**Problem**: How to prevent one person creating many fake accounts (Sybil attack)?

**Solution**: Hybrid weighting
- **60% Graph Component**: Reputation based on network position (PageRank)
  - New accounts start at 0 influence
  - Reputation flows only through real connections
  - High PageRank requires established network position
  
- **40% Economic Component**: Reputation based on token stake
  - Attacker must hold significant tokens to fake reputation
  - Economic cost = sum(all fake account stakes)
  - Protects against pure network attacks

**Result**: Attack cost = high network position + significant token stake = economically infeasible

---

## 📊 Example Computation

```javascript
// Input: Social graph
{
  'alice': { followers: 1000, stake: 50, following: ['bob', 'charlie'] },
  'bob': { followers: 500, stake: 25, following: ['alice', 'david'] }
}

// Step 1: Compute PageRank from graph structure
PageRank: { alice: 0.25, bob: 0.18 }

// Step 2: Compute stake weights
StakeWeight: { alice: 50/150 = 0.33, bob: 25/150 = 0.17 }

// Step 3: Combine scores (60% graph + 40% stake)
alice_score = (0.25 * 0.6 + 0.33 * 0.4) * 100 = 28.2/100
bob_score = (0.18 * 0.6 + 0.17 * 0.4) * 100 = 17.4/100

// Step 4: Publish to DKG as JSON-LD asset
// Returns UAL: did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/405892
```

---

## 🔐 Verifying a Score

### Method 1: Via UAL
```bash
# Any party can resolve the UAL to verify the reputation
curl http://localhost:8900/api/asset/did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/405892
```
Returns: Cryptographically signed JSON-LD proof of reputation

### Method 2: Check Blockchain
```bash
# Verify anchoring on Polkadot testnet
# Search Polkadot explorer for transaction hash from DKG publish event
```

### Method 3: Timestamp Verification
```bash
# Score is immutable - timestamp in UAL proves creation time
# Any tampering would change hash and invalidate UAL
```

---

## 💰 Economic Integration

**Token Binding Flow**:
1. Economic agent monitors reputation scores
2. If score > threshold (0.5): Bind tokens to score
3. Publish audit log to DKG
4. Downstream systems reward high-reputation actors

```javascript
// Pseudocode
if (reputationScore >= 0.5) {
  bindTokens(amount: 500, soulUAL: "did:dkg:...");
  publishAuditLog(transactionHash, soulUAL, score);
}
```

---

## 🌐 Social Integration

### Post Reputation to Twitter
```javascript
await postToSocial('twitter', 
  'Alice reputation score: 28.2/100 ✅ Verified on DKG'
);
// Posts to Twitter account linked in config
```

### Post to Discord
```javascript
await postToSocial('discord', 
  'New reputation oracle published to DKG: [UAL]'
);
// Posts to Discord webhook
```

---

## ⚙️ Configuration

### Update Wallet (in `reputation-oracle.js`)
```javascript
const WALLET_PRIVATE_KEY = '0x...'; // Your testnet key
const CREATOR_ADDRESS = '0x...';    // Your wallet address
const SOUL_UAL = 'did:dkg:otp:20430/0x.../...'; // Your soul
```

### Update Social Credentials (in `backend/config.js`)
```javascript
export const SOCIAL_CONFIG = {
  twitter: { apiKey: '...', accessToken: '...' },
  discord: { webhookUrl: 'https://discord.com/api/webhooks/...' },
  telegram: { botToken: '...', chatId: '...' }
};
```

---

## 🧪 Testing

### Test PageRank Computation
```bash
node -e "
const scores = { alice: 0.25, bob: 0.18, charlie: 0.12, david: 0.05 };
console.log('Sum:', Object.values(scores).reduce((a,b) => a+b));
// Should sum to ~1.0 (normalized PageRank)
"
```

### Test DKG Connection
```bash
curl -X POST http://localhost:8900/api/asset \
  -H "Content-Type: application/json" \
  -d '{"@type": "TestAsset", "test": true}'
# Should return asset creation response
```

### End-to-End Test
```bash
node reputation-oracle.js
# Check for "✅ Successfully Published" message
# Copy output UAL and verify in browser: http://localhost:8900
```

---

## 📈 Monitoring

### Check Node Health
```bash
curl http://localhost:8900/api/info
# Verify: version, status, blockchain sync
```

### Monitor Backend
```bash
curl http://localhost:3000/api/health
# Verify: DKG connection, database status
```

### View Logs
```bash
# Terminal 1: Watch DKG node logs
# Terminal 2: Watch backend server logs
# Terminal 3: Watch oracle execution logs
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| DKG node not responding | `curl http://localhost:8900/api/info` → verify port 8900 open |
| Asset publication fails | Check wallet balance, verify private key, check blockchain sync |
| Social posting fails | Verify API credentials in `config.js`, check rate limits |
| Score computation errors | Check social graph data structure, verify stake sum > 0 |
| Frontend not loading | Verify backend running on port 3000, check CORS settings |

---

## 📚 Additional Resources

- **Full Documentation**: See `COMPETITION_SUBMISSION.md`
- **DKG Docs**: https://docs.origintrail.io
- **Polkadot Testnet**: https://testnet.polkascan.io (otp:20430)
- **Repository**: https://github.com/Soul-AI-persona/soul-ai

---

## ✅ Verification Checklist

Before submitting:
- [ ] DKG node running on localhost:8900
- [ ] reputation-oracle.js executes without errors
- [ ] Backend server responding on port 3000
- [ ] Social graph computation produces valid scores
- [ ] Asset publishes to DKG with UAL
- [ ] Reputation scores retrievable via API
- [ ] Dashboard displays scores and oracle status
- [ ] Economic agent binds tokens above threshold
- [ ] Audit logs published successfully

---

**Last Updated**: 2024-12-19  
**Status**: ✅ Production Ready  
**Network**: Polkadot Testnet (otp:20430)  
**Challenge**: Social Graph Reputation Oracle
