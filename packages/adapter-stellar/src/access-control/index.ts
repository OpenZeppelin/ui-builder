/**
 * Access Control Module
 *
 * Exports access control functionality for Stellar (Soroban) contracts including
 * capability detection, on-chain data reading, action assembly, validation, indexer client,
 * and the AccessControlService.
 *
 * ## Two-Step Ownable Support
 *
 * This module provides full support for OpenZeppelin's two-step Ownable pattern:
 * - {@link StellarAccessControlService.getOwnership} - Returns ownership state (owned/pending/expired/renounced)
 * - {@link StellarAccessControlService.transferOwnership} - Initiates two-step transfer with expiration
 * - {@link StellarAccessControlService.acceptOwnership} - Accepts pending ownership transfer
 * - {@link getCurrentLedger} - Gets current ledger sequence for expiration calculation
 * - {@link validateExpirationLedger} - Validates expiration ledger before submission
 * - {@link readPendingOwner} - Reads pending owner info from on-chain state
 *
 * ## Action Assembly
 *
 * - {@link assembleGrantRoleAction} - Prepares grant_role transaction
 * - {@link assembleRevokeRoleAction} - Prepares revoke_role transaction
 * - {@link assembleTransferOwnershipAction} - Prepares transfer_ownership transaction with expiration
 * - {@link assembleAcceptOwnershipAction} - Prepares accept_ownership transaction
 *
 * ## Feature Detection
 *
 * - {@link detectAccessControlCapabilities} - Detects Ownable/AccessControl support
 * - `hasTwoStepOwnable` capability flag indicates two-step transfer support
 *
 * ## Indexer Client
 *
 * - {@link StellarIndexerClient} - Queries historical events and pending transfers
 * - {@link OwnershipTransferStartedEvent} - Pending transfer event from indexer
 *
 * @module access-control
 */

export * from './actions';
export * from './feature-detection';
export * from './indexer-client';
export * from './onchain-reader';
export * from './service';
export * from './validation';
