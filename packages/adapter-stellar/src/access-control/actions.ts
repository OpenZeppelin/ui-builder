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
 * Assembles transaction data for granting a role to an account
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param account The account address to grant the role to
 * @returns Transaction data ready for execution
 */
export function assembleGrantRoleAction(
  contractAddress: string,
  roleId: string,
  account: string
): StellarTransactionData {
  logger.info(
    'assembleGrantRoleAction',
    `Assembling grant_role action for ${roleId} to ${account}`
  );

  // Arguments for grant_role(account: Address, role: Symbol)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  return {
    contractAddress,
    functionName: 'grant_role',
    args: [account, roleId],
    argTypes: ['Address', 'Symbol'],
    argSchema: undefined,
    transactionOptions: {},
  };
}

/**
 * Assembles transaction data for revoking a role from an account
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param account The account address to revoke the role from
 * @returns Transaction data ready for execution
 */
export function assembleRevokeRoleAction(
  contractAddress: string,
  roleId: string,
  account: string
): StellarTransactionData {
  logger.info(
    'assembleRevokeRoleAction',
    `Assembling revoke_role action for ${roleId} from ${account}`
  );

  // Arguments for revoke_role(account: Address, role: Symbol)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  return {
    contractAddress,
    functionName: 'revoke_role',
    args: [account, roleId],
    argTypes: ['Address', 'Symbol'],
    argSchema: undefined,
    transactionOptions: {},
  };
}

/**
 * Assembles transaction data for transferring ownership of a contract
 *
 * @param contractAddress The contract address
 * @param newOwner The new owner address
 * @returns Transaction data ready for execution
 */
export function assembleTransferOwnershipAction(
  contractAddress: string,
  newOwner: string
): StellarTransactionData {
  logger.info(
    'assembleTransferOwnershipAction',
    `Assembling transfer_ownership action to ${newOwner}`
  );

  // Arguments for transfer_ownership(new_owner: Address)
  // Note: args are raw values that will be converted to ScVal by the transaction execution flow
  return {
    contractAddress,
    functionName: 'transfer_ownership',
    args: [newOwner],
    argTypes: ['Address'],
    argSchema: undefined,
    transactionOptions: {},
  };
}
