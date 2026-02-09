/**
 * Access Control Module
 *
 * Exports access control functionality for EVM-compatible contracts including
 * capability detection, on-chain data reading, action assembly, validation, indexer client,
 * and the AccessControlService.
 *
 * ## Two-Step Ownable Support
 *
 * This module provides full support for OpenZeppelin's two-step Ownable pattern:
 * - {@link EvmAccessControlService.getOwnership} - Returns ownership state (owned/pending/renounced)
 * - {@link EvmAccessControlService.transferOwnership} - Initiates two-step transfer
 * - {@link EvmAccessControlService.acceptOwnership} - Accepts pending ownership transfer
 * - {@link EvmAccessControlService.renounceOwnership} - Renounces ownership (EVM-specific)
 *
 * ## Two-Step Admin Transfer Support
 *
 * This module provides full support for OpenZeppelin's two-step admin transfer pattern:
 * - {@link EvmAccessControlService.getAdminInfo} - Returns admin state (active/pending/renounced)
 * - {@link EvmAccessControlService.transferAdminRole} - Initiates two-step admin transfer
 * - {@link EvmAccessControlService.acceptAdminTransfer} - Accepts pending admin transfer
 * - {@link EvmAccessControlService.cancelAdminTransfer} - Cancels pending admin transfer
 * - {@link EvmAccessControlService.changeAdminDelay} - Schedules admin delay change
 * - {@link EvmAccessControlService.rollbackAdminDelay} - Rolls back pending admin delay change
 *
 * ## Action Assembly
 *
 * - {@link assembleTransferOwnershipAction} - Prepares transferOwnership transaction
 * - {@link assembleAcceptOwnershipAction} - Prepares acceptOwnership transaction
 * - {@link assembleRenounceOwnershipAction} - Prepares renounceOwnership transaction
 * - {@link assembleGrantRoleAction} - Prepares grantRole transaction
 * - {@link assembleRevokeRoleAction} - Prepares revokeRole transaction
 * - {@link assembleRenounceRoleAction} - Prepares renounceRole transaction
 * - {@link assembleBeginAdminTransferAction} - Prepares beginDefaultAdminTransfer transaction
 * - {@link assembleAcceptAdminTransferAction} - Prepares acceptDefaultAdminTransfer transaction
 * - {@link assembleCancelAdminTransferAction} - Prepares cancelDefaultAdminTransfer transaction
 * - {@link assembleChangeAdminDelayAction} - Prepares changeDefaultAdminDelay transaction
 * - {@link assembleRollbackAdminDelayAction} - Prepares rollbackDefaultAdminDelay transaction
 *
 * ## Feature Detection
 *
 * - {@link detectAccessControlCapabilities} - Detects Ownable/AccessControl support from ABI
 * - {@link validateAccessControlSupport} - Validates contract has at least one AC capability
 * - `hasTwoStepOwnable` capability flag indicates two-step ownership transfer support
 * - `hasTwoStepAdmin` capability flag indicates two-step admin transfer support
 *
 * ## Indexer Client
 *
 * - {@link EvmIndexerClient} - Queries historical events and pending transfers
 * - {@link createIndexerClient} - Factory for creating indexer clients
 *
 * @module access-control
 */

export * from './actions';
export * from './constants';
export * from './feature-detection';
export * from './indexer-client';
export * from './onchain-reader';
export * from './service';
export type { EvmAccessControlContext, EvmTransactionExecutor } from './types';
export * from './validation';
