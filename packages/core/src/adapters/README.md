# Chain Adapter System

This directory contains the adapter implementations for different blockchain ecosystems. The adapter pattern allows the Transaction Form Builder to support multiple blockchains while keeping the UI components chain-agnostic.

## Structure

- `index.ts` - Defines the `ContractAdapter` interface and exports the adapter factory
- `/evm` - Ethereum Virtual Machine adapter implementation (primary focus)
- `/midnight` - Midnight protocol adapter implementation (minimal placeholder only)
- `/stellar` - Stellar network adapter implementation (minimal placeholder only)
- `/solana` - Solana blockchain adapter implementation (minimal placeholder only)

## Current Development Status

**IMPORTANT**: The project is currently focusing **exclusively** on the EVM adapter implementation as the primary blockchain ecosystem. The other adapters (Midnight, Stellar, Solana) are provided only as minimal placeholders with dummy implementations and will be properly implemented in future phases.

Do not rely on the non-EVM adapters for any production use as they contain only stub implementations that return placeholder values.

## Adapter Pattern Guidelines

The adapter pattern in this project follows these principles:

1. A single `ContractAdapter` interface defines all methods that must be implemented
2. Each blockchain has its own adapter implementation (e.g., `EVMAdapter`, `SolanaAdapter`)
3. Adapters encapsulate all blockchain-specific logic and provide a consistent interface to the application

### Strict Interface Adherence

To maintain a clean architecture and prevent implementation drift, we enforce strict interface adherence through:

1. A custom ESLint rule that checks all adapter implementations
2. Clear documentation of the allowed methods in the `ContractAdapter` interface
3. Code review processes that verify new implementations follow the pattern

### ESLint Rule: no-extra-adapter-methods

We've implemented a custom ESLint rule that validates adapter implementations against the `ContractAdapter` interface. This rule ensures:

- All methods in adapter classes must be defined in the `ContractAdapter` interface
- Any helper methods must be marked as `private`
- Common methods like constructors are allowed

### How to run the linter

To validate all adapters:

```bash
pnpm lint:adapters
```

## Adapter Interface

Each adapter must implement the `ContractAdapter` interface defined in `index.ts`:

```typescript
export interface ContractAdapter {
  // Load a contract from a file or address
  loadContract(source: string): Promise<ContractSchema>;

  // Load a mock contract for testing
  loadMockContract(mockId?: string): Promise<ContractSchema>;

  // Get only the functions that modify state (writable functions)
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'];

  // Map a blockchain-specific parameter type to a form field type
  mapParameterTypeToFieldType(parameterType: string): FieldType;

  // Generate default field configuration for a function parameter
  generateDefaultField(parameter: FunctionParameter): FormField;

  // Format transaction data for the specific chain
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown;

  // Sign and broadcast a transaction
  signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }>;

  // Validate a blockchain address for this chain
  isValidAddress(address: string): boolean;
}
```

### Allowed methods

The following methods are defined in the `ContractAdapter` interface and must be implemented by each adapter:

- `loadContract`
- `loadMockContract`
- `getWritableFunctions`
- `mapParameterTypeToFieldType`
- `generateDefaultField`
- `formatTransactionData`
- `signAndBroadcast`
- `isValidAddress`

### Contract Function State Modification Flag

The `ContractAdapter` interface supports a `modifiesState` flag on each `ContractFunction` object within the `ContractSchema`. This flag indicates whether a function modifies the blockchain state (true) or is read-only (false). This allows the UI to appropriately display and handle different function types:

- State-modifying functions (e.g., `transfer`, `mint`): Can be selected for transaction form generation
- Read-only functions (e.g., `balanceOf`, `totalSupply`): Cannot be selected for transaction forms but can be shown for reference

The `getWritableFunctions` method returns only the functions that have `modifiesState: true`, which is useful for filtering functions that can be used in transaction forms.

## Private Helper Methods

If you need to add implementation-specific methods:

1. Mark them as `private` using TypeScript's accessibility modifier
2. Use them only within the adapter class
3. Consider if the shared functionality could be part of the interface

Example:

```typescript
class MyAdapter implements ContractAdapter {
  // Public interface method
  public async signAndBroadcast(txData: unknown): Promise<{ txHash: string }> {
    const formattedData = this.formatData(txData);
    return this.sendToNetwork(formattedData);
  }

  // Private helper method
  private formatData(data: unknown): FormattedData {
    // Implementation details
  }
}
```

## Adding New Interface Methods

If you find yourself needing the same functionality across multiple adapters, consider:

1. Propose an addition to the `ContractAdapter` interface
2. Document the new method thoroughly
3. Implement it across all adapter classes
4. Update tests accordingly

## Field Type Mapping

Each blockchain has its own data types that need to be mapped to form field types. The field type mapping functionality includes:

1. `mapParameterTypeToFieldType` - Maps blockchain parameter types to form field types
2. `generateDefaultField` - Creates a complete form field configuration with validation, default values, etc.

### Available Form Field Types

The following form field types are available:

- `text` - Standard text input
- `number` - Numeric input with support for min/max values
- `amount` - Specialized input for token amounts with decimals handling
- `address` - Specialized input for blockchain addresses with validation
- `checkbox` - Boolean toggle
- `select` - Dropdown selection from options
- `radio` - Radio button selection
- `textarea` - Multi-line text input
- `date` - Date picker
- `email` - Email input with validation
- `password` - Password input with masking
- `hidden` - Hidden field

## EVM Adapter Implementation

The EVM adapter is the primary implementation and serves as a reference for other blockchain adapters. Here's how the field-type mapping is implemented for EVM:

### Type Mapping

EVM-specific data types are mapped to form field types using a dictionary:

```typescript
const EVM_TYPE_MAPPING: Record<string, FieldType> = {
  address: 'address',
  string: 'text',
  uint256: 'amount',
  uint8: 'number',
  uint16: 'number',
  uint32: 'number',
  uint64: 'number',
  uint128: 'number',
  uint: 'number',
  int8: 'number',
  int16: 'number',
  int32: 'number',
  int64: 'number',
  int128: 'number',
  int256: 'number',
  int: 'number',
  bool: 'checkbox',
  bytes: 'text',
  bytes32: 'text',
};
```

### Field Type Mapping Logic

The `mapParameterTypeToFieldType` method in the EVM adapter handles special cases and array types:

```typescript
mapParameterTypeToFieldType(parameterType: string): FieldType {
  // Remove array suffix if present (e.g., uint256[] -> uint256)
  const baseType = parameterType.replace(/\[\d*\]$/, '');

  // Handle tuples (structs) - for now, just use a textarea
  if (baseType.startsWith('tuple')) {
    return 'textarea';
  }

  // Return the mapped type or default to text if no mapping exists
  return EVM_TYPE_MAPPING[baseType] || 'text';
}
```

### Default Field Generation

The `generateDefaultField` method creates complete form field configurations based on the parameter:

```typescript
generateDefaultField(parameter: FunctionParameter): FormField {
  const fieldType = this.mapParameterTypeToFieldType(parameter.type);

  return {
    id: generateId(),
    name: parameter.name || parameter.type,
    label: parameter.displayName || parameter.name || parameter.type,
    type: fieldType,
    placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    helperText: parameter.description || '',
    defaultValue: this.getDefaultValueForType(fieldType),
    validation: this.getDefaultValidationForType(parameter.type),
    width: 'full',
  };
}
```

### Default Values and Validation

The EVM adapter provides appropriate default values and validation rules based on the parameter type:

```typescript
// Default values
private getDefaultValueForType(fieldType: FieldType): unknown {
  switch (fieldType) {
    case 'checkbox':
      return false;
    case 'number':
    case 'amount':
      return 0;
    case 'address':
      return '';
    default:
      return '';
  }
}

// Validation rules
private getDefaultValidationForType(parameterType: string): {
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
} {
  const validation = { required: true };

  // Ethereum addresses need specific validation
  if (parameterType === 'address') {
    return {
      ...validation,
      pattern: '^0x[a-fA-F0-9]{40}$',
      minLength: 42,
      maxLength: 42
    };
  }

  return validation;
}
```

## Best Practices

1. **Encapsulation**: Keep all blockchain-specific logic within adapter classes
2. **Single Responsibility**: Each method should do one thing well
3. **Testability**: Write adapters to be easily testable with mock data
4. **Documentation**: Document the behavior of each method clearly, especially any edge cases
5. **Error Handling**: Use consistent error handling patterns across adapters

## Usage in UI Components

UI components should never directly implement chain-specific logic. Instead, they should:

1. Get the appropriate adapter for the selected chain using `getContractAdapter(chainType)`
2. Use the adapter's methods for all chain-specific operations

```typescript
// Example of using an adapter in a component
const adapter = getContractAdapter(contractSchema.chainType);
const formFields = selectedFunctionDetails.inputs.map((input) =>
  adapter.generateDefaultField(input)
);
```

## Extending with New Blockchain Adapters

To add support for a new blockchain ecosystem:

1. Create a new subdirectory for your blockchain (e.g., `/my-chain`)
2. Implement the adapter class that implements the `ContractAdapter` interface
3. Add type mapping for your blockchain's parameter types
4. Update the adapter factory in `index.ts` to include your new adapter

Use the EVM adapter as a reference implementation for creating new blockchain adapters.

## Future Plans

In the future, the placeholder adapters for Midnight, Stellar, and Solana will be properly implemented with:

1. Proper contract loading mechanisms specific to each blockchain
2. Accurate parameter type to field type mappings
3. Appropriate validation rules for each blockchain's data types
4. Complete transaction formatting and signing implementations

For now, please use only the EVM adapter for production purposes.
