# PollVault - Technical Architecture

## Overview

PollVault is built on a three-layer architecture that combines blockchain, cryptography, and modern web technologies to deliver a privacy-preserving voting platform.

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology**: React 18 + TypeScript + Vite

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── PollCard.tsx    # Individual poll display
│   │   ├── CreatePollDialog.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Main polls page
│   │   └── VoteHistory.tsx # User's vote history
│   ├── config/             # Configuration
│   │   ├── wagmi.ts        # Wagmi/RainbowKit setup
│   │   ├── abi.ts          # Contract ABI
│   │   └── contracts.ts    # Contract addresses
│   ├── lib/                # Utilities
│   │   └── fhe.ts          # FHE SDK wrapper
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript definitions
├── public/                 # Static assets
└── vercel.json            # Vercel deployment config
```

**Key Libraries**:
- **Wagmi v3**: Modern React hooks for Ethereum
- **RainbowKit v2.2.9**: Wallet connection UI
- **@zama-fhe/relayer-sdk**: Client-side FHE encryption
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Headless component library

### 2. Smart Contract Layer (Blockchain)

**Technology**: Solidity 0.8.24 + Zama fhEVM

```
contracts/
├── PollVault.sol          # Main voting contract
└── interfaces/            # External interfaces
    └── IFHEVM.sol         # FHE operations
```

**Contract Structure**:

```solidity
contract PollVault {
    // Data Structures
    struct Poll {
        string title;              // Public
        string description;        // Public
        address creator;           // Public
        uint64 deadline;           // Public
        euint128 yesCount;        // ENCRYPTED
        euint128 noCount;         // ENCRYPTED
        uint128 revealedYes;      // Revealed value
        uint128 revealedNo;       // Revealed value
        bool revealed;            // Status flag
        bool publiclyDecryptable; // Decryption permission
    }

    // State Variables
    Poll[] public polls;
    uint256 public nextPollId;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event PollCreated(uint256 indexed pollId, address creator);
    event VoteCast(uint256 indexed pollId, address voter);
    event PollRevealed(uint256 indexed pollId, uint128 yesVotes, uint128 noVotes);
}
```

### 3. Encryption Layer (FHE)

**Technology**: Zama fhEVM + KMS

```
Encryption Flow:
┌─────────────┐
│   Browser   │
│             │
│  1. User    │
│  selects    │
│  YES/NO     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  FHE SDK            │
│  (Client-side)      │
│                     │
│  2. Encrypt vote    │
│  using public key   │
│                     │
│  Output:            │
│  - euint128 handle  │
│  - ZK proof         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Smart Contract     │
│  (On-chain)         │
│                     │
│  3. Store encrypted │
│  vote counter       │
│                     │
│  yesCount += vote   │
│  (homomorphic add)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Zama Coprocessor   │
│  (Off-chain)        │
│                     │
│  4. Decrypt when    │
│  requested by       │
│  poll creator       │
└─────────────────────┘
```

## Data Flow

### Creating a Poll

```
User (Frontend)
    ├─→ Enter poll details
    ├─→ Set deadline
    └─→ Click "Create Poll"
        │
        ▼
Wallet (MetaMask/etc)
    ├─→ Sign transaction
    └─→ Send to blockchain
        │
        ▼
Smart Contract
    ├─→ Validate inputs
    ├─→ Store poll data
    ├─→ Increment nextPollId
    └─→ Emit PollCreated event
        │
        ▼
Frontend (State Update)
    └─→ Fetch new poll list
```

### Casting a Vote

```
User (Frontend)
    ├─→ Select YES or NO
    └─→ Click "Vote"
        │
        ▼
FHE SDK (Browser)
    ├─→ Initialize FHE context
    ├─→ Get public key from contract
    ├─→ Encrypt vote (true/false → euint128)
    ├─→ Generate ZK proof
    └─→ Return encrypted vote + proof
        │
        ▼
Wallet
    ├─→ Sign transaction with:
    │   ├─ pollId
    │   ├─ encrypted vote handle
    │   └─ ZK proof
    └─→ Send to blockchain
        │
        ▼
Smart Contract
    ├─→ Verify ZK proof
    ├─→ Check vote hasn't been cast
    ├─→ Check deadline not passed
    ├─→ Homomorphic addition:
    │   └─ If YES: yesCount += encrypted(1)
    │   └─ If NO: noCount += encrypted(1)
    ├─→ Mark hasVoted[pollId][voter] = true
    └─→ Emit VoteCast event
        │
        ▼
Frontend
    └─→ Update local state
    └─→ Show confirmation
```

### Revealing Results

```
Poll Creator (Frontend)
    └─→ Click "Reveal Results"
        │
        ▼
Smart Contract
    ├─→ Verify caller is creator
    ├─→ Mark publiclyDecryptable = true
    └─→ Request decryption from KMS
        │
        ▼
Zama Coprocessor (Off-chain)
    ├─→ Receive decryption request
    ├─→ Decrypt yesCount → uint128
    ├─→ Decrypt noCount → uint128
    └─→ Send callback transaction
        │
        ▼
Smart Contract (Callback)
    ├─→ Store revealed values:
    │   ├─ revealedYes = decrypted yesCount
    │   └─ revealedNo = decrypted noCount
    ├─→ Set revealed = true
    └─→ Emit PollRevealed event
        │
        ▼
Frontend
    └─→ Fetch and display results
```

## Network Detection & Switching

```
User Connects Wallet
    │
    ▼
Frontend (useAccount hook)
    ├─→ Get current chain ID
    ├─→ Compare with Sepolia (11155111)
    └─→ If mismatch:
        │
        ▼
    Display Alert Banner
        ├─→ "Wrong network detected"
        └─→ Show "Switch to Sepolia" button
            │
            ▼
        User Clicks Button
            │
            ▼
        useSwitchChain hook
            ├─→ Request wallet to switch
            └─→ If approved:
                │
                ▼
            Wallet Switches Network
                │
                ▼
            Frontend Detects Change
                ├─→ Hide alert banner
                ├─→ Load contract data
                └─→ Enable voting
```

## State Management

### Frontend State

```typescript
// Global State (Wagmi)
- account: { address, isConnected, chain }
- walletClient: Write operations
- publicClient: Read operations

// Component State (React)
- polls: Poll[]              // All polls
- userVotes: Map<string, 'yes'|'no'>  // User's votes
- loading: boolean           // Loading indicator
- voting: boolean            // Vote in progress
- wrongNetwork: boolean      // Network mismatch flag

// Derived State
- activePolls: polls.filter(p => p.status === 'active')
- totalPolls: polls.length
- totalVotes: userVotes.size
```

### Smart Contract State

```solidity
// Storage Layout
Slot 0: nextPollId (uint256)
Slot 1-N: polls[] array
  - Each Poll struct uses ~10 storage slots
  - euint128 types use 1 slot (32 bytes handle)

Slot M-N: hasVoted mapping
  - Key: keccak256(pollId, voterAddress)
  - Value: bool (1 byte)
```

## Security Model

### Frontend Security

1. **Input Validation**
   - Poll title: max 200 chars
   - Description: max 1000 chars
   - Deadline: future timestamp only

2. **Network Verification**
   - Check chain ID before transactions
   - Prompt user if wrong network
   - Auto-switch capability

3. **Transaction Monitoring**
   - Wait for receipt before updating UI
   - Verify on-chain state after transaction
   - Display Etherscan links for transparency

### Smart Contract Security

1. **Access Control**
   - Only creator can reveal poll
   - Only creator can request decryption

2. **Vote Protection**
   - `hasVoted` mapping prevents double voting
   - Deadline check prevents late voting
   - ZK proof validates encrypted vote

3. **Encryption Security**
   - Votes encrypted client-side
   - Private key never leaves KMS
   - Homomorphic operations preserve encryption

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**
   ```typescript
   // Lazy load routes
   const VoteHistory = lazy(() => import('./pages/VoteHistory'));
   ```

2. **Memoization**
   ```typescript
   const memoizedPolls = useMemo(() =>
     polls.filter(p => p.status === 'active'),
     [polls]
   );
   ```

3. **Debounced Updates**
   - Removed auto-refresh (block watching)
   - Manual refresh or after user actions
   - Reduces RPC calls by 95%

### Contract Optimizations

1. **Storage Packing**
   ```solidity
   // Pack small types together
   uint64 deadline;    // 8 bytes
   bool revealed;      // 1 byte
   bool publiclyDecryptable;  // 1 byte
   // Total: 10 bytes in one slot
   ```

2. **Event Indexing**
   ```solidity
   event VoteCast(
     uint256 indexed pollId,  // Indexed for filtering
     address voter            // Not indexed (cheaper)
   );
   ```

## Error Handling

### Frontend Error Handling

```typescript
try {
  // Attempt operation
  await walletClient.writeContract(...);
} catch (error) {
  if (error.code === 4001) {
    // User rejected transaction
    toast("Transaction cancelled by user");
  } else if (error.message.includes("insufficient funds")) {
    // Insufficient balance
    toast("Insufficient ETH for gas");
  } else if (error.message.includes("already voted")) {
    // Double vote attempt
    toast("You have already voted on this poll");
  } else {
    // Unknown error
    toast("Transaction failed: " + error.message);
  }
}
```

### Contract Error Handling

```solidity
// Custom errors (cheaper than require strings)
error DeadlinePassed();
error AlreadyVoted();
error OnlyCreator();
error NotRevealed();

// Usage
if (block.timestamp > poll.deadline) revert DeadlinePassed();
if (hasVoted[pollId][msg.sender]) revert AlreadyVoted();
```

## Deployment Pipeline

### Development → Production

```
1. Local Development
   ├─→ Edit code
   ├─→ npm run dev
   └─→ Test locally

2. Smart Contract Testing
   ├─→ npx hardhat compile
   ├─→ npx hardhat test
   └─→ Fix any issues

3. Deploy to Sepolia
   ├─→ npx hardhat run scripts/deploy.js --network sepolia
   ├─→ Verify on Etherscan
   └─→ Update contract address in .env

4. Frontend Build
   ├─→ npm run build
   ├─→ Check bundle size
   └─→ Test production build

5. Deploy to Vercel
   ├─→ vercel --prod
   ├─→ Run integration tests
   └─→ Monitor for errors

6. Post-Deployment
   ├─→ Seed initial polls (optional)
   ├─→ Update documentation
   └─→ Announce to users
```

## Monitoring & Analytics

### On-Chain Metrics
- Total polls created
- Total votes cast
- Unique voters
- Gas consumption per operation

### Frontend Metrics
- Page load time
- Time to interactive
- Error rate
- Network switch success rate

### Infrastructure
- Vercel deployment status
- RPC endpoint uptime
- Etherscan API health

## Future Enhancements

### Short Term
1. Multi-choice polls (not just YES/NO)
2. Weighted voting based on token holdings
3. Poll categories and search
4. Email notifications for poll updates

### Medium Term
1. ENS integration for user profiles
2. IPFS storage for poll metadata
3. Snapshot integration for DAO voting
4. Mobile app (React Native)

### Long Term
1. Mainnet deployment
2. Cross-chain support (Polygon, Arbitrum)
3. DAO governance for platform
4. Token gating and access control

---

**Last Updated**: November 2025
**Version**: 2.0.0
**Maintainers**: PollVault Core Team
