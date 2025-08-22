// Mock for @creit.tech/stellar-wallets-kit to avoid CommonJS issues in tests

export const WalletNetwork = {
  TESTNET: 'TESTNET',
  PUBLIC: 'PUBLIC',
};

export class StellarWalletsKit {
  constructor(_options: Record<string, unknown>) {
    // Mock constructor
  }

  async getAddress() {
    return { address: 'GBTEST123456789' };
  }

  async setWallet(_walletId: string) {
    // Mock implementation
  }

  async getSupportedWallets() {
    return [
      {
        id: 'freighter',
        name: 'Freighter',
        icon: 'https://example.com/freighter.png',
        isAvailable: true,
        type: 'browser',
      },
    ];
  }

  async signTransaction(_xdr: string, _options: Record<string, unknown>) {
    return { signedTxXdr: 'mock-signed-xdr' };
  }
}

export function allowAllModules() {
  return [];
}

export interface ISupportedWallet {
  id: string;
  name: string;
  icon: string;
  isAvailable: boolean;
  type: string;
}
