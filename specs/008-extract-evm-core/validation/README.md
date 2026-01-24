# SC-002 Validation: Code Reuse Demonstration

This directory contains validation artifacts for Success Criterion SC-002:
> "New EVM-compatible adapters require <50% of the code compared to building from scratch"

## Validation Approach

### Baseline Measurement

The baseline is the adapter-evm package core logic that was extracted to adapter-evm-core:

| Module | LOC (approx) |
|--------|-------------|
| ABI loading/transformation | 800 |
| Type mapping/field generation | 400 |
| Input/output transformation | 300 |
| Query handler | 200 |
| Transaction formatting | 150 |
| Configuration resolution | 300 |
| Validation utilities | 200 |
| Other utilities | 150 |
| **Total** | **~2,500** |

### Minimal Adapter Implementation

See `minimal-adapter.ts` for a complete ContractAdapter implementation using adapter-evm-core:

| Component | LOC |
|-----------|-----|
| Imports and types | 20 |
| Network configuration | 30 |
| Adapter class (delegation to core) | 150 |
| **Total** | **~200** |

### Calculation

```
New Code Required = 200 LOC
Baseline Code = 2,500 LOC
Code Reuse Percentage = 200 / 2500 = 8%
```

**Result: 8% new code required, well under the 50% target**

## What New Adapters Get for Free

By using adapter-evm-core, new EVM-compatible adapters automatically get:

1. **ABI Operations** - Loading from Etherscan, Sourcify, artifacts; transformation to ContractSchema
2. **Type Mapping** - Complete EVM type to form field mapping with dynamic patterns
3. **Form Field Generation** - Default field configuration for all EVM types
4. **Input Parsing** - Parse user input strings to typed EVM values
5. **Output Formatting** - Format contract call results for display
6. **View Function Querying** - Execute read-only contract calls
7. **Transaction Formatting** - Prepare transaction data for execution
8. **Address Validation** - EVM address validation
9. **Configuration Resolution** - RPC and explorer URL resolution

## What New Adapters Must Implement

Chain-specific logic that varies by chain:

1. **Network Configuration** - Chain ID, RPC URLs, explorer URLs
2. **Wallet Integration** - If using a different wallet library than wagmi
3. **Chain-Specific UI** - Custom wallet components if needed

## Running the Validation

```bash
# Verify the minimal adapter compiles
cd specs/008-extract-evm-core/validation
npx tsc --noEmit minimal-adapter.ts

# Or with the workspace TypeScript configuration
pnpm exec tsc --noEmit --project ../../tsconfig.json
```

## Files

- `minimal-adapter.ts` - Minimal ContractAdapter implementation demonstrating <50% code reuse
- `README.md` - This validation documentation
