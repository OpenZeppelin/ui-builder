# Data Model: Add Midnight Adapter

## Entities

- WalletConnection
  - isConnected: boolean
  - address?: string
  - chainId?: string

- Network
  - id: string
  - name: string
  - ecosystem: 'midnight'
  - rpcEndpoints: { default: string }
  - connectivity: { lastTestMs?: number; lastResult?: 'success' | 'failure' }

- ContractArtifacts
  - contractAddress: string (Bech32m)
  - privateStateId: string
  - contractSchema: string (.d.ts text)
  - contractModule: string (.cjs text)
  - witnessCode?: string
  - validation: required fields; format checks; size limits for large text inputs

- ContractSchema
  - name: string
  - ecosystem: 'midnight'
  - address: string
  - functions: FunctionDefinition[]
  - events: EventDefinition[]

- FunctionDefinition
  - id: string (unique)
  - name: string
  - inputs: { name: string; type: string; required?: boolean }[]
  - modifiesState: boolean
  - returnType?: string

- TransactionPayload
  - functionId: string
  - params: Record<string, unknown>
  - preparedAt: number (epoch ms)

- ExecutionConfig (v1)
  - method: 'wallet'

- ExportManifest
  - packages: string[] (adapter + peers)
  - config: Record<string, unknown>
  - postInstallNotes?: string

## Relationships

- WalletConnection relates to Network via chainId/network id.
- ContractArtifacts produce ContractSchema via adapter `loadContract`.
- ContractSchema provides FunctionDefinition used to build forms and TransactionPayload.

- ExportManifest composes required pieces for the exported React app to function.

## Validation Rules

- ContractArtifacts fields required: contractAddress, privateStateId, contractSchema, contractModule.
- Address format validation via adapter `isValidAddress`.
- Prevent empty or oversized text blobs; show helpful errors.
- ExecutionConfig restricted to method 'wallet' in v1.
