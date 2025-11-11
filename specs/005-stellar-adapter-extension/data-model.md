# Data Model: Stellar Adapter Extension — Access Control

## Entities

### AccessControlCapabilities
- hasOwnable: boolean
- hasAccessControl: boolean
- hasEnumerableRoles: boolean
- supportsHistory: boolean
- verifiedAgainstOZInterfaces: boolean
- notes?: string[]

### OwnershipInfo
- owner: string | null

### RoleIdentifier
- id: string            # stable identifier (e.g., name, bytes, symbol rendered to string)
- label?: string        # optional human-friendly label

### RoleAssignment
- role: RoleIdentifier
- members: string[]     # addresses/accounts with role

### AccessSnapshot
- roles: RoleAssignment[]
- ownership?: OwnershipInfo

### HistoryEntry (adapter-specific, when history supported)
- role: RoleIdentifier
- account: string
- changeType: 'GRANTED' | 'REVOKED'
- txId: string
- timestamp?: string    # ISO8601 (if available)
- ledger?: number       # optional ledger/sequence

### OperationResult
- id: string            # transaction/operation identifier

## Relationships
- AccessSnapshot.ownership references OwnershipInfo.
- AccessSnapshot.roles[*].role references RoleIdentifier.
- HistoryEntry.role references RoleIdentifier.

## Validation Rules
- Address fields MUST pass shared address validation (`isValidAddress(address, addressType?)`).
- `RoleIdentifier.id` MUST be non-empty; `label` optional.
- `RoleAssignment.members` MUST be unique strings (no duplicates).
- `AccessSnapshot.roles` MUST NOT contain duplicate roles by `RoleIdentifier.id`.
- `HistoryEntry.changeType` MUST be one of the allowed literals.
- `OperationResult.id` MUST be non-empty.

## State Transitions
- Grant role: If account not present in `RoleAssignment.members`, add it; idempotent otherwise.
- Revoke role: If account present in `RoleAssignment.members`, remove it; idempotent otherwise.
- Transfer ownership: Replace `OwnershipInfo.owner` with new address after successful operation.
- Snapshot: Represents read-only projection at a point in time; no mutation implied.***


