import { logger } from '@openzeppelin/ui-builder-utils';

import { LaceWalletImplementation } from '../implementation/lace-implementation';

let initialized = false;
let instance: LaceWalletImplementation | undefined;

const LOG_SYSTEM = 'MidnightWalletImplementationManager';

/**
 * Initialize the Midnight wallet system once. For now our implementation
 * is a thin wrapper around the Lace API with event shims, so there is no
 * heavy async setup. This manager exists to mirror Stellar's structure and
 * allow future expansion without changing public imports.
 */
export async function getMidnightWalletImplementation(): Promise<LaceWalletImplementation> {
  if (!initialized) {
    logger.info(LOG_SYSTEM, 'Initializing Midnight wallet implementation (lightweight).');
    instance = new LaceWalletImplementation();
    initialized = true;
  }
  return instance as LaceWalletImplementation;
}

/**
 * Synchronous getter for cases where initialization was already performed.
 */
export function getInitializedMidnightWalletImplementation(): LaceWalletImplementation | undefined {
  if (!initialized) {
    logger.warn(LOG_SYSTEM, 'getInitialized called before initialization.');
    return undefined;
  }
  return instance;
}
