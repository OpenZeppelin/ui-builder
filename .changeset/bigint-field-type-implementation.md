---
'@openzeppelin/ui-builder-types': minor
'@openzeppelin/ui-builder-ui': minor
'@openzeppelin/ui-builder-renderer': minor
'@openzeppelin/ui-builder-utils': minor
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-app': patch
---

Add BigInt field type for safe handling of large integers beyond JavaScript Number precision

**Breaking Behavior Changes:**

- Large integer types (64-bit and above) now map to `bigint` field type instead of `number`
  - **EVM**: `uint64`, `uint128`, `uint256`, `int64`, `int128`, `int256`
  - **Stellar**: `U64`, `U128`, `U256`, `I64`, `I128`, `I256`
- BigInt values are stored and transmitted as strings to prevent precision loss

**New Features:**

- Added new `BigIntField` component with built-in integer validation
- Added `createBigIntTransform()` for proper string-based value handling
- BigInt field now available in UI Builder field type dropdown under "Numeric" category

**Improvements:**

- Fixes uint256 truncation issue (#194)
- Prevents precision loss for values exceeding `Number.MAX_SAFE_INTEGER` (2^53-1)
- Simplified field generation by removing redundant type-specific validation logic from adapters
- Component-based validation ensures consistency across all blockchain ecosystems

**Technical Details:**

- `BigIntField` uses string storage to handle arbitrary-precision integers
- Integer-only validation via regex (`/^-?\d+$/`)
- Compatible field types properly ordered with `bigint` as recommended type
- Transform functions ensure safe conversion between UI and blockchain formats
