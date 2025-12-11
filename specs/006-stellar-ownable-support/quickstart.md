# Quickstart: Stellar Ownable Two-Step Transfer

This guide explains how to use the Stellar Access Control service for two-step ownership transfers with ledger-based expiration.

## Overview

The Stellar Ownable module implements a two-step ownership transfer pattern:

1. **Current owner** calls `transferOwnership(newOwner, expirationLedger)`
2. **Pending owner** calls `acceptOwnership()` before the expiration ledger

This prevents accidental transfers and provides a window for the new owner to accept.

## Prerequisites

- Contract deployed with OpenZeppelin Stellar Ownable module
- Stellar adapter configured with network and indexer
- Wallet connected for transaction signing

## Basic Usage

### 1. Check Ownership Status

```typescript
import { createStellarAccessControlService } from '@openzeppelin/ui-builder-adapter-stellar';

// Create service instance
const service = createStellarAccessControlService(networkConfig);

// Register the contract
service.registerContract(contractAddress, contractSchema);

// Get ownership information
const ownership = await service.getOwnership(contractAddress);

console.log('Current owner:', ownership.owner);
console.log('Ownership state:', ownership.state);

if (ownership.state === 'pending' && ownership.pendingTransfer) {
  console.log('Pending owner:', ownership.pendingTransfer.pendingOwner);
  console.log('Expires at ledger:', ownership.pendingTransfer.expirationLedger);
}
```

### 2. Initiate Ownership Transfer

```typescript
// Get current ledger for expiration calculation
const currentLedger = await service.getCurrentLedger();

// Set expiration to ~12 hours from now
// Stellar ledgers advance every ~5 seconds
// 12 hours = 12 * 60 * 60 / 5 = 8640 ledgers
const expirationLedger = currentLedger + 8640;

// Validate expiration before submitting
const validation = await service.validateExpirationLedger(expirationLedger);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Initiate transfer (must be called by current owner)
const result = await service.transferOwnership(
  contractAddress,
  newOwnerAddress,
  expirationLedger,
  executionConfig,
  (status, details) => {
    console.log(`Transaction status: ${status}`, details);
  }
);

console.log('Transfer initiated, txHash:', result.id);
```

### 3. Accept Ownership Transfer

```typescript
// Check if there's a pending transfer
const ownership = await service.getOwnership(contractAddress);

if (ownership.state !== 'pending') {
  throw new Error('No pending transfer to accept');
}

// Accept transfer (must be called by pending owner)
const result = await service.acceptOwnership(
  contractAddress,
  executionConfig,
  (status, details) => {
    console.log(`Transaction status: ${status}`, details);
  }
);

console.log('Ownership accepted, txHash:', result.id);
```

## Understanding Ownership States

| State     | Description                                    | Next Actions                                    |
| --------- | ---------------------------------------------- | ----------------------------------------------- |
| `owned`   | Contract has active owner, no pending transfer | Owner can initiate transfer                     |
| `pending` | Transfer initiated, awaiting acceptance        | Pending owner can accept; owner can re-transfer |
| `expired` | Previous transfer expired without acceptance   | Owner can initiate new transfer                 |

## Handling Edge Cases

### Indexer Unavailable

When the indexer is unavailable, pending transfer status cannot be determined:

```typescript
const ownership = await service.getOwnership(contractAddress);

// Current owner is always available via direct contract query
console.log('Owner:', ownership.owner);

// State may be 'owned' even if there's a pending transfer
// when indexer is unavailable
if (!indexerAvailable) {
  console.warn('Pending transfer status may be inaccurate - indexer unavailable');
}
```

### Expired Transfer Handling

If a transfer expires, the original owner retains ownership:

```typescript
const ownership = await service.getOwnership(contractAddress);

if (ownership.state === 'expired') {
  console.log('Previous transfer expired');
  console.log('Owner still:', ownership.owner);
  // Owner can initiate a new transfer
}
```

### Overlapping Transfers

Initiating a new transfer while one is pending automatically cancels the existing pending transfer:

```typescript
// Even if there's a pending transfer, a new transfer can be initiated
// This will replace the existing pending transfer
await service.transferOwnership(
  contractAddress,
  differentNewOwner,
  newExpirationLedger,
  executionConfig
);
```

## Feature Detection

Check if a contract supports two-step Ownable:

```typescript
const capabilities = await service.getCapabilities(contractAddress);

if (capabilities.hasTwoStepOwnable) {
  console.log('Contract supports two-step ownership transfer');
} else if (capabilities.hasOwnable) {
  console.log('Contract has basic Ownable (may not support two-step)');
}
```

## Expiration Ledger Guidelines

| Timeframe | Ledgers (~5s each) | Use Case                    |
| --------- | ------------------ | --------------------------- |
| 1 hour    | 720                | Quick handoff               |
| 12 hours  | 8,640              | Standard transfer           |
| 24 hours  | 17,280             | Cross-timezone coordination |
| 7 days    | 120,960            | Complex governance approval |

```typescript
// Helper to calculate expiration
function calculateExpirationLedger(currentLedger: number, hours: number): number {
  const ledgersPerHour = 720; // 60 * 60 / 5
  return currentLedger + hours * ledgersPerHour;
}
```

## Error Handling

```typescript
try {
  await service.transferOwnership(/* ... */);
} catch (error) {
  if (error instanceof ConfigurationInvalid) {
    // Expiration ledger already passed
    console.error('Invalid expiration:', error.message);
  } else if (error instanceof OperationFailed) {
    // Transaction failed on-chain
    console.error('Transfer failed:', error.message);
  }
}
```

## Integration with Builder UI

The Stellar adapter automatically integrates with the Contract UI Builder:

1. **Capability detection** identifies Ownable contracts
2. **Ownership panel** displays current state and pending transfers
3. **Transfer action** pre-validates expiration before submission
4. **Accept action** only shown to pending owner
