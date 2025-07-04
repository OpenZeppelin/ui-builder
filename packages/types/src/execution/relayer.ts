export interface RelayerDetails {
  relayerId: string;
  name: string;
  address: string;
  network: string;
  paused: boolean;
}

export interface RelayerExecutionConfig {
  method: 'relayer';
  serviceUrl: string;
  relayer: RelayerDetails;
}
