# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hidden Vote** is a privacy-preserving voting DApp built on Scaffold-ETH 2, enabling anonymous on-chain voting using zero-knowledge proofs. Voters prove membership in an eligible voter set without revealing their identity.

## Architecture

This is a **Yarn v3 monorepo** with three main packages:

### 1. `packages/hardhat` - Smart Contracts
- **VotingFactory.sol**: Factory pattern for deploying new Voting instances
- **Voting.sol**: Main voting contract with:
  - LeanIMT (Lean Incremental Merkle Tree) for voter commitments
  - ZK proof verification for anonymous votes
  - Registration phase (owner adds voter commitments)
  - Voting phase (voters submit proofs + encrypted votes)
  - Support for 2-16 voting options
- **Verifier.sol**: Auto-generated UltraHonk verifier from Noir circuit

### 2. `packages/nextjs` - Frontend (Next.js 15 App Router)
- Built with React 19, TypeScript, TailwindCSS, DaisyUI
- Uses Scaffold-ETH 2 hooks and components
- Key pages:
  - `/votings` - Browse/create votings
  - `/votings/[address]` - Vote on a specific voting
  - `/votings/[address]/manage` - Owner management
  - `/debug` - Debug Contracts UI (Scaffold-ETH 2 feature)
- **Account Abstraction**: Uses Permissionless.js with Pimlico paymaster for gasless transactions

### 3. `packages/circuits` - Noir ZK Circuits
- Proves knowledge of `nullifier` and `secret` without revealing voter identity
- Verifies Merkle tree membership (voter commitment)
- Supports up to 2^16 (65,536) voters
- Uses Poseidon hash for commitments
- UltraHonk proving backend via bb.js

## Development Commands

### Initial Setup
```bash
yarn install
```

### Local Development (3 terminals)
```bash
# Terminal 1: Start local blockchain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start
```

Visit `http://localhost:3000`

### Smart Contract Development
```bash
yarn hardhat:compile        # Compile contracts
yarn hardhat:test           # Run contract tests
yarn hardhat:deploy         # Deploy to configured network
yarn hardhat:verify         # Verify contracts on Etherscan
yarn hardhat:clean          # Clean artifacts
yarn hardhat:flatten        # Flatten contracts for verification
```

### Frontend Development
```bash
yarn next:build             # Build production frontend
yarn next:check-types       # TypeScript type checking
yarn next:lint              # Lint frontend code
yarn next:format            # Format frontend code
```

### Code Quality
```bash
yarn format                 # Format all code (Next.js + Hardhat)
yarn lint                   # Lint all code
yarn test                   # Run all tests
```

### Deployment
```bash
yarn vercel                 # Deploy frontend to Vercel
yarn ipfs                   # Deploy frontend to IPFS
```

### Account Management
```bash
yarn account:generate       # Generate new deployer account
yarn account:import         # Import existing private key
yarn account:reveal-pk      # Reveal deployer private key
```

## Smart Contract Interaction Patterns

**IMPORTANT**: Always use Scaffold-ETH 2 hooks for contract interactions. Never use raw wagmi/viem calls directly.

### Reading Contract Data
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data: someData } = useScaffoldReadContract({
  contractName: "Voting",
  functionName: "functionName",
  args: [arg1, arg2], // optional
});
```

### Writing to Contracts
```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract("Voting");

await writeContractAsync({
  functionName: "functionName",
  args: [arg1, arg2],
  value: parseEther("0.1"), // optional, for payable functions
});
```

### Reading Contract Events
```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const { data: events, isLoading, error } = useScaffoldEventHistory({
  contractName: "Voting",
  eventName: "VoteCast",
  watch: true, // optional, watches for new events
});
```

### Other Available Hooks
- `useScaffoldWatchContractEvent` - Watch for specific events in real-time
- `useDeployedContractInfo` - Get deployed contract info
- `useScaffoldContract` - Get contract instance
- `useTransactor` - Wrap transactions with notifications

## UI Components

Always use Scaffold-ETH 2 components for Ethereum interactions:

- `<Address address={addr} />` - Display Ethereum addresses
- `<AddressInput value={addr} onChange={setAddr} />` - Input for addresses
- `<Balance address={addr} />` - Display ETH/USDC balance
- `<EtherInput value={val} onChange={setVal} />` - Input with ETH/USD conversion

Located in `packages/nextjs/components/scaffold-eth/`

## Contract Deployment

Contracts are deployed using scripts in `packages/hardhat/deploy/`. The deployment system:
- Auto-generates TypeScript types in `packages/nextjs/contracts/deployedContracts.ts`
- Frontend automatically picks up new contracts via hot reload
- Network configuration in `packages/nextjs/scaffold.config.ts`

## Zero-Knowledge Proof Flow

1. **Registration**: Owner adds voter commitments to Merkle tree
   - Commitment = Poseidon(nullifier, secret)
2. **Voting**: Voter generates ZK proof
   - Proves knowledge of nullifier + secret
   - Proves commitment exists in Merkle tree
   - Submits proof + nullifier + encrypted vote
3. **Verification**: Contract verifies proof on-chain
   - Uses UltraHonk verifier
   - Checks nullifier hasn't been used
   - Records anonymous vote

## Tech Stack Details

- **Blockchain**: Base mainnet (target network)
- **Wallet Integration**: RainbowKit for wallet connections
- **Contract Framework**: Hardhat (not Foundry in this project)
- **Styling**: TailwindCSS with DaisyUI themes (light/synthwave)
- **State Management**: React hooks + Wagmi
- **ZK Libraries**: @noir-lang/noir_js, @aztec/bb.js, @zk-kit/lean-imt

## Configuration Files

- `packages/hardhat/hardhat.config.ts` - Hardhat network config
- `packages/nextjs/scaffold.config.ts` - Frontend network config, burner wallet settings
- `packages/nextjs/tailwind.config.ts` - Tailwind + DaisyUI theming

## Important Notes

- Next.js uses **App Router**, not Pages Router
- Contract data comes from `deployedContracts.ts` and `externalContracts.ts`
- Debug Contracts page at `/debug` provides auto-generated UI for all contracts
- Verifier.sol is auto-generated - regenerate via Noir circuit compilation
- Node.js >= 20.18.3 required
