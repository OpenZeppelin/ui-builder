/**
 * ABI Module
 *
 * Functions for loading, transforming, and comparing EVM contract ABIs.
 *
 * @module abi
 */

// Barrel file for abi module
export * from './transformer';
export { loadAbiFromEtherscan, loadAbiFromEtherscanV1, type EtherscanAbiResult } from './etherscan';
export {
  loadAbiFromEtherscanV2,
  shouldUseV2Api,
  testEtherscanV2Connection,
  type EtherscanAbiResult as EtherscanV2AbiResult,
} from './etherscan-v2';
export { loadAbiFromSourcify, getSourcifyContractAppUrl, type SourcifyAbiResult } from './sourcify';
export { loadEvmContract, type EvmContractLoadResult, type ContractLoadOptions } from './loader';
export * from './types';
export { AbiComparisonService, abiComparisonService } from './comparison';
