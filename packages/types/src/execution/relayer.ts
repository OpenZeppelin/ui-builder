import type { NetworkType } from '../common/ecosystem';

export interface RelayerDetails {
  relayerId: string;
  name: string;
  address: string;
  network: string;
  networkType: NetworkType;
  paused: boolean;
}

export interface RelayerExecutionConfig {
  method: 'relayer';
  serviceUrl: string;
  relayer: RelayerDetails;
}
