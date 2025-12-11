/**
 * Access Control Actions Module
 *
 * Assembles transaction data for access control operations (grant/revoke roles, transfer ownership)
 * on Stellar (Soroban) contracts. These actions prepare transaction data that can be executed
 * via the standard Stellar transaction execution flow.
 */

import { logger } from '@openzeppelin/ui-builder-utils';

import type { StellarTransactionData } from '../transaction/formatter';

/**
 * Special placeholder value that gets replaced with the connected wallet address
 * at transaction execution time. Used when the caller parameter should be the
 * transaction sender (connected wallet).
 *
 * @see EoaExecutionStrategy - replaces this placeholder before building the transaction
 */
export const CALLER_PLACEHOLDER = '__CALLER__';

/**
 * Assembles transaction data for granting a role to an account
 *
 * Note: OpenZeppelin Stellar AccessControl requires a `caller` parameter for authorization.
 * The caller is the address authorizing the role grant (must have admin privileges).
 * Use CALLER_PLACEHOLDER to use the connected wallet address as the caller.
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param account The account address to grant the role to
 * @param caller The address authorizing the grant (defaults to CALLER_PLACEHOLDER for connected wallet)
 * @returns Transaction data ready for execution
 */
export function assembleGrantRoleAction(
  contractAddress: string,
  roleId: string,
  account: string,
  caller: string = CALLER_PLACEHOLDER
): StellarTransactionData {
  logger.info(
    'assembleGrantRoleAction',
    `Assembling grant_role action for ${roleId} to ${account} (caller: ${caller})`
  );

  // Arguments for grant_role(account: Address, role: Symbol, caller: Address)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  // The caller parameter is required by OpenZeppelin Stellar AccessControl for authorization
  return {
    contractAddress,
    functionName: 'grant_role',
    args: [account, roleId, caller],
    argTypes: ['Address', 'Symbol', 'Address'],
    argSchema: undefined,
    transactionOptions: {},
  };
}

/**
 * Assembles transaction data for revoking a role from an account
 *
 * Note: OpenZeppelin Stellar AccessControl requires a `caller` parameter for authorization.
 * The caller is the address authorizing the role revocation (must have admin privileges).
 * Use CALLER_PLACEHOLDER to use the connected wallet address as the caller.
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param account The account address to revoke the role from
 * @param caller The address authorizing the revocation (defaults to CALLER_PLACEHOLDER for connected wallet)
 * @returns Transaction data ready for execution
 */
export function assembleRevokeRoleAction(
  contractAddress: string,
  roleId: string,
  account: string,
  caller: string = CALLER_PLACEHOLDER
): StellarTransactionData {
  logger.info(
    'assembleRevokeRoleAction',
    `Assembling revoke_role action for ${roleId} from ${account} (caller: ${caller})`
  );

  // Arguments for revoke_role(account: Address, role: Symbol, caller: Address)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  // The caller parameter is required by OpenZeppelin Stellar AccessControl for authorization
  return {
    contractAddress,
    functionName: 'revoke_role',
    args: [account, roleId, caller],
    argTypes: ['Address', 'Symbol', 'Address'],
    argSchema: undefined,
    transactionOptions: {},
  };
}

/**
 * Assembles transaction data for transferring ownership of a contract
 *
 * For two-step Ownable contracts, this initiates a transfer that must be accepted
 * by the pending owner before the expiration ledger.
 *
 * @param contractAddress The contract address
 * @param newOwner The new owner address
 * @param liveUntilLedger The ledger sequence by which the transfer must be accepted
 * @returns Transaction data ready for execution
 */
export function assembleTransferOwnershipAction(
  contractAddress: string,
  newOwner: string,
  liveUntilLedger: number
): StellarTransactionData {
  logger.info(
    'assembleTransferOwnershipAction',
    `Assembling transfer_ownership action to ${newOwner} with expiration at ledger ${liveUntilLedger}`
  );

  // Arguments for transfer_ownership(new_owner: Address, live_until_ledger: u32)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  return {
    contractAddress,
    functionName: 'transfer_ownership',
    args: [newOwner, liveUntilLedger],
    argTypes: ['Address', 'u32'],
    argSchema: undefined,
    transactionOptions: {},
  };
}

/**
 * Assembles transaction data for accepting a pending ownership transfer
 *
 * For two-step Ownable contracts, this completes a pending transfer initiated by
 * the current owner. Must be called by the pending owner before the expiration ledger.
 *
 * @param contractAddress The contract address
 * @returns Transaction data ready for execution
 */
export function assembleAcceptOwnershipAction(contractAddress: string): StellarTransactionData {
  logger.info(
    'assembleAcceptOwnershipAction',
    `Assembling accept_ownership action for ${contractAddress}`
  );

  // accept_ownership() has no arguments - caller must be the pending owner
  return {
    contractAddress,
    functionName: 'accept_ownership',
    args: [],
    argTypes: [],
    argSchema: undefined,
    transactionOptions: {},
  };
}
