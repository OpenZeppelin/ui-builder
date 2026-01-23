import type { RelayerExecutionConfig } from '@openzeppelin/ui-types';

/**
 * Validates a relayer execution configuration.
 *
 * @param config The relayer execution config to validate
 * @returns true if valid, or an error message string if invalid
 */
export async function validateRelayerConfig(
  config: RelayerExecutionConfig
): Promise<true | string> {
  if (!config.serviceUrl) {
    return 'Relayer execution selected, but no service URL was provided.';
  }
  if (!config.relayer?.relayerId) {
    return 'Relayer execution selected, but no relayer was chosen from the list.';
  }
  return true;
}

/**
 * Simple validation of relayer config.
 * Useful for static validation before execution.
 */
export function validateEvmRelayerConfig(config: RelayerExecutionConfig): boolean {
  if (!config.serviceUrl) {
    return false;
  }
  if (!config.relayer?.relayerId) {
    return false;
  }
  return true;
}
