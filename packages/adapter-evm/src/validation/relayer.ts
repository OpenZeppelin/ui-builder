import { RelayerExecutionConfig } from '@openzeppelin/contracts-ui-builder-types';

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
