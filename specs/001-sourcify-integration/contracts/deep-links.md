# Deep Link Contract

## Parameters (Chain‑Agnostic)

- ecosystem: identifies target ecosystem (required; e.g., `evm`, `stellar`, `solana`, `midnight`).
- networkIdentifier: identifies target network within the ecosystem (adapter interprets; e.g., EVM `chainId`).
- contractIdentifier: identifies contract/resource (adapter validates via existing `isValidAddress` or equivalent).
- service (optional): provider key to force a specific contract definition provider.

## Semantics

- Precedence: deep link > saved session.
- Unknown params ignored; invalid required params block with message.
- Forced service:
  - Unsupported → automatically fall back to adapter default order.
  - Failure (not found/unavailable) → stop with clear message (no fallback).

## Mapping to Adapter Inputs

- Parameters map to names returned by `adapter.getContractDefinitionInputs()` (e.g., EVM `contractAddress`, Stellar `contractAddress`/`Contract ID`).
- Validation uses `adapter.isValidAddress(address, addressType?)` where applicable. No new validation entrypoints added.

## Examples

- EVM: `?ecosystem=evm&address=0x...&chainId=1&service=etherscan`
- EVM (fallback provider forced): `?ecosystem=evm&address=0x...&chainId=1&service=sourcify`
- Stellar: `?contractId=C...&networkPassphrase=Test SDF Network ; September 2015`
