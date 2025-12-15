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
 *
 * ## Two-Step Admin Transfer Support
 *
 * This module provides full support for OpenZeppelin's two-step admin transfer pattern:
 * - {@link StellarAccessControlService.getAdminInfo} - Returns admin state (active/pending/expired/renounced)
 * - {@link StellarAccessControlService.transferAdminRole} - Initiates two-step admin transfer with expiration
 * - {@link StellarAccessControlService.acceptAdminTransfer} - Accepts pending admin transfer
 * - {@link AdminTransferInitiatedEvent} - Pending admin transfer event from indexer
 *
 * ## Action Assembly
 *
 * - {@link assembleGrantRoleAction} - Prepares grant_role transaction
 * - {@link assembleRevokeRoleAction} - Prepares revoke_role transaction
 * - {@link assembleTransferOwnershipAction} - Prepares transfer_ownership transaction with expiration
 * - {@link assembleAcceptOwnershipAction} - Prepares accept_ownership transaction
 * - {@link assembleTransferAdminRoleAction} - Prepares transfer_admin_role transaction with expiration
 * - {@link assembleAcceptAdminTransferAction} - Prepares accept_admin_transfer transaction
 *
 * ## Feature Detection
 *
 * - {@link detectAccessControlCapabilities} - Detects Ownable/AccessControl support
 * - `hasTwoStepOwnable` capability flag indicates two-step ownership transfer support
 * - `hasTwoStepAdmin` capability flag indicates two-step admin transfer support
 *
 * ## Indexer Client
 *
 * - {@link StellarIndexerClient} - Queries historical events and pending transfers
 * - {@link OwnershipTransferStartedEvent} - Pending ownership transfer event from indexer
 * - {@link AdminTransferInitiatedEvent} - Pending admin transfer event from indexer
 *
 * @module access-control
 */

export * from './actions';
export * from './feature-detection';
export * from './indexer-client';
export * from './onchain-reader';
export * from './service';
export * from './validation';
