# Deep Link Contract

## Parameters (Chain‑Agnostic)

- networkIdentifier: identifies target network (adapter interprets).
- contractIdentifier: identifies contract/resource (adapter validates).
- service (optional): provider key to force a specific verification provider.

## Semantics

- Precedence: deep link > saved session.
- Unknown params ignored; invalid required params block with message.
- Forced service:
  - Unsupported → automatically fall back to adapter default order.
  - Failure (not found/unavailable) → stop with clear message (no fallback).

## Examples

- EVM: `?address=0x...&chainId=1&service=etherscan`
- EVM (fallback provider forced): `?address=0x...&chainId=1&service=sourcify`
- Other ecosystem: `?contractId=ABC123&networkId=testnet&service=<provider>`
