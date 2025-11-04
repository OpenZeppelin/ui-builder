## Midnight adapter: native types, field mapping, and serialization (chain-agnostic, adapter-led)

This document defines the Midnight adapter’s type mapping and bidirectional serialization strategy. It mirrors the established patterns in the EVM and Stellar adapters while preserving the chain‑agnostic and adapter‑led boundaries of the UI Builder. It also consolidates insights from the in-repo `midnight-deploy-cli` and the current Midnight adapter implementation.

### Native types, internal FieldType, and UI components

The UI Builder maps ecosystem-native types to internal `FieldType`s, which are rendered via components in `packages/renderer/src/components/fieldRegistry.ts`. The table below captures the core Midnight schema kinds and recommended defaults.

| Midnight schema kind / example | Default FieldType     | UI component   | Notes                                                                              |
| ------------------------------ | --------------------- | -------------- | ---------------------------------------------------------------------------------- |
| primitive.bigint               | bigint                | BigIntField    | Accepts string/number/bigint, coerced to BigInt. Display as string.                |
| primitive.number               | number                | NumberField    | Constrain to safe JS numbers. For monetary amounts, allow `amount` as alternative. |
| primitive.boolean              | checkbox              | BooleanField   | Also compatible with select/radio for UX flexibility.                              |
| primitive.string               | text                  | TextField      | General purpose text. For addresses, see contract-definition inputs.               |
| bytes (Uint8Array)             | bytes                 | BytesField     | Accept hex `0x…` or raw file; convert to `Uint8Array`. Display as hex.             |
| array<T> (e.g., Array<string>) | array                 | ArrayField     | If T is object/tuple-like, use `array-object` → ArrayObjectField.                  |
| maybe<T> (optional)            | (same as T, optional) | Component of T | Represented by optional validation; empty → null.                                  |
| opaque<T>                      | text                  | TextAreaField  | Opaque by default; if inner type known, treat as inner type.                       |
| enum (named set of values)     | enum                  | EnumField      | Chain-agnostic enum shape `{ tag, values? }`; render variants.                     |

Additional ecosystem fields (contract definition level):

- Contract address: `blockchain-address` → AddressField (Midnight accepts 68-char hex for contracts and Bech32m for user accounts). The adapter’s `isValidAddress` validates both.
- Contract artifacts (ZIP): `file-upload` → FileUploadField
- Runtime secret (organizer-only circuits): `runtimeSecret` → PasswordField; runtime-only, never persisted.

References:

- Renderer field registry mapping FieldType to components:

```1:62:packages/renderer/src/components/fieldRegistry.ts
import React from 'react';
// ... existing code ...
export const fieldComponents: Record<
  FieldType,
  React.ComponentType<BaseFieldProps<FormValues> & { adapter?: ContractAdapter }>
> = {
  text: TextField,
  number: NumberField,
  bigint: BigIntField,
  'blockchain-address': AddressField,
  checkbox: BooleanField,
  radio: RadioField,
  select: SelectField,
  'select-grouped': SelectGroupedField,
  textarea: TextAreaField,
  bytes: BytesField,
  'code-editor': CodeEditorField,
  // ... more components ...
  enum: EnumField,
  'file-upload': FileUploadField,
  runtimeSecret: PasswordField,
};
```

### Midnight schema model (source of truth)

The `midnight-deploy-cli` extracts a contract schema with typed inputs/outputs for circuits and queries. Its local schema parser models types as:

- `primitive`: `bigint`, `string`, `number`, `boolean`
- `bytes`: `Uint8Array` (size-hinted where available)
- `array<T>`
- `maybe<T>` (optional values)
- `opaque<T>` (fallback when unknown)
- `enum` (listed under `types.enums` in schema)

Parser (abridged):

```290:332:midnight-deploy-cli/src/schema-local.ts
function parseType(type: string): SchemaType {
  switch (type) {
    case 'bigint': return { kind: 'primitive', type: 'bigint' };
    case 'string': return { kind: 'primitive', type: 'string' };
    case 'number': return { kind: 'primitive', type: 'number' };
    case 'boolean': return { kind: 'primitive', type: 'boolean' };
    case 'Uint8Array': return { kind: 'bytes', size: 32 };
    default: /* array, maybe, generics → inner */
  }
}
```

### Adapter responsibilities and boundaries

Keep all chain‑specific logic inside the Midnight adapter, not in shared UI/builder layers:

- Map Midnight-native types to `FieldType`s: `packages/adapter-midnight/src/mapping/type-mapper.ts`
- Generate field configs for function inputs: `ContractAdapter.generateDefaultField`
- Parse UI inputs into native values: `packages/adapter-midnight/src/transform/input-parser.ts`
- Format transaction data: `packages/adapter-midnight/src/transaction/formatter.ts`
- Execute via strategy: `packages/adapter-midnight/src/transaction/*`
- Convert query results to displayable values: `packages/adapter-midnight/src/query/executor.ts`, `transform/output-formatter.ts`

### Mapping strategy (mirror EVM/Stellar)

Other adapters implement:

- A “type → default field” mapping and a “compatible field types” mapping for flexibility.
- A recursive parser that converts raw form values to chain-native types.

References:

```1:32:packages/adapter-evm/src/mapping/constants.ts
export const EVM_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  address: 'blockchain-address', string: 'text', uint64: 'bigint', int64: 'bigint', bool: 'checkbox', bytes: 'textarea', bytes32: 'text',
};
```

```95:203:packages/adapter-stellar/src/mapping/type-mapper.ts
export function getStellarCompatibleFieldTypes(parameterType: string): FieldType[] {
  // Address, U64/U128 → bigint/number/amount/text, Bool → checkbox/select/radio, Bytes/BytesN → bytes/textarea
  // Tuples/Instance → object, Vec/Map → array/map, Enums → enum/select/radio
}
```

```15:79:packages/adapter-evm/src/transform/input-parser.ts
export function parseEvmInput(param: FunctionParameter, rawValue: unknown, isRecursive = false): unknown {
  // Arrays (top-level JSON, recursive arrays pass-through) → recurse
  // Tuples (top-level JSON object) → recurse by components
  // Bytes → validate 0x… and fixed sizes
  // Int/Uint → BigInt
  // Address → checksum
  // Bool/String → coerce
}
```

```30:168:packages/adapter-stellar/src/transaction/formatter.ts
// Orders args by ABI, transforms each via parseStellarInput, preserves arg types/schema for ScVal conversion
```

We will mirror these patterns for Midnight.

## Midnight: UI → native serialization

Implement `parseMidnightInput(value: unknown, parameterType: string): unknown` with the following rules:

- primitive.bigint: accept string/number/bigint, coerce to `BigInt`; reject empty.
- primitive.number: coerce to `number`; reject NaN/Infinity.
- primitive.boolean: `boolean` or string `'true'|'false'` (case-insensitive); fallback to truthy/falsy.
- primitive.string: `String(value)`.
- bytes (Uint8Array):
  - If string: must be hex with `0x` prefix; convert to `Uint8Array`.
  - If File/Blob: read to bytes; if base64 string, decode to bytes.
- array<T>:
  - Top-level string inputs in simple fields: expect JSON array string; parse then recurse on each item.
  - If already an array (from `ArrayField`), recurse on each item.
- maybe<T>:
  - Empty string, undefined, or explicit null → `null`.
  - Otherwise parse as T.
- opaque<T>:
  - If inner type is known (adapter can be given hints via schema), treat as inner type.
  - Otherwise pass through as string; prefer `textarea` UI for large values.
- enum:
  - Accept chain‑agnostic enum value (e.g., `{ tag: 'Variant', values?: [...] }`), similar to Stellar.
  - If schema provides simple variant list, allow selecting a tag and optional values array.

Error handling:

- Raise descriptive errors including parameter name/type on parse failures (consistent with EVM parser style).
- Validate hex formatting and fixed byte lengths if the schema specifies size (future enhancement).

Implementation location and current stub:

```1:10:packages/adapter-midnight/src/transform/input-parser.ts
export function parseMidnightInput(value: unknown, _parameterType: string): unknown {
  logger.warn('adapter-midnight', 'parseMidnightInput not implemented, returning raw value.');
  return value;
}
```

## Midnight: native → UI serialization (results)

Two layers format results for rendering:

- Query executor converts SDK/native values to JSON‑serializable values for the app (BigInt→string; bytes→hex; recursive over arrays/objects):

```220:254:packages/adapter-midnight/src/query/executor.ts
private convertValueToSerializable(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) return '0x' + Buffer.from(value).toString('hex');
  if (Array.isArray(value)) return value.map((v) => this.convertValueToSerializable(v));
  // ... recurse objects ...
}
```

- Output formatter renders decoded values for function results (display safety and stability):

```11:47:packages/adapter-midnight/src/transform/output-formatter.ts
export function formatMidnightFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
  if (typeof decodedValue === 'bigint') return decodedValue.toString();
  if (typeof decodedValue === 'string' || typeof decodedValue === 'number' || typeof decodedValue === 'boolean') return String(decodedValue);
  return JSON.stringify(decodedValue, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
}
```

## Transaction formatting and execution

Formatting mirrors EVM/Stellar: order inputs per ABI, extract values (hardcoded/hidden rules), transform with parser, then hand off to execution.

```17:77:packages/adapter-midnight/src/transaction/formatter.ts
const transformedArgs = expectedArgs.map((param, index) => {
  let valueToParse = orderedRawValues[index];
  if (typeof param.type === 'string' && param.type.includes('[]') && Array.isArray(valueToParse)) {
    // Arrays: pass through; parser will recurse
  }
  return parseMidnightInput(valueToParse, param.type);
});
```

Execution strategies (EOA for now) initialize providers, optionally seed organizer secret into the private state provider, and perform `callCircuit`. See `transaction/*` and `providers.ts` for details. Organizer-only circuits use a runtime-only secret bound by the renderer (never persisted):

```992:1050:packages/adapter-midnight/TRANSACTION_IMPLEMENTATION.md
// runtimeSecret field added only when needed; extracted at execution time and seeded into private state
```

## Field mapping API (adapter)

Provide the same adapter surface as EVM/Stellar:

- `mapParameterTypeToFieldType(type)`: default field type for a chain type
- `getCompatibleFieldTypes(type)`: all acceptable `FieldType`s for a chain type (used by Builder to offer alternatives, e.g., checkbox/select/radio for booleans)
- `generateDefaultField(param)`: label/placeholder/validation plus default FieldType

Current Midnight stubs to replace:

```199:205:packages/adapter-midnight/src/adapter.ts
public mapParameterTypeToFieldType(_parameterType: string): FieldType { return 'text'; }
public getCompatibleFieldTypes(_parameterType: string): FieldType[] { return ['text']; }
```

Recommended defaults (aligned with the table above):

- bigint → `bigint` (compat: bigint, number, amount, text)
- number → `number` (compat: number, amount, text)
- boolean → `checkbox` (compat: checkbox, select, radio, text)
- string → `text` (compat: text, textarea, email, password)
- bytes → `bytes` (compat: bytes, textarea, text)
- array<T> → `array` or `array-object` depending on T
- maybe<T> → same as T but with `validation.required=false`
- opaque<T> → `text` (compat: text, textarea)
- enum → `enum` (compat: enum, select, radio, text)

## Edge cases and validation

- BigInt range: reject empty inputs; display as strings to avoid precision loss.
- Bytes validation: require `0x` prefix; enforce fixed sizes where schema provides sizes.
- Arrays: accept JSON strings at top-level `textarea` fields (EVM pattern) and proper arrays from `ArrayField`.
- Maybe/nullables: empty string/undefined → null; do not emit placeholders to native args.
- Opaque: leave as-is unless schema indicates inner type; prefer textarea for large payloads.
- Addresses: for function inputs that are addresses but typed as strings, leave as `text` by default; Builder users can override to `blockchain-address` if desired. Contract definition inputs (address) always use `blockchain-address` with adapter validation.

## Testing plan

Unit tests (adapter-midnight):

- Type mapping: `mapParameterTypeToFieldType` and `getCompatibleFieldTypes` for each core type.
- Parser: primitives, bytes, arrays (nested), maybe<T>, enums, opaque pass-through.
- Formatter: ordering, hardcoded/hidden rules; arrays pass-through; error messaging context.
- Output formatting: BigInt and bytes rendering.

Cross-adapter parity:

- Mirror EVM’s JSON-at-top-level array behavior and tuple/object recursion style.
- Mirror Stellar’s enum handling (chain-agnostic shape) and generic type recursion.

## Implementation checklist (no code changes here)

- mapping
  - Implement `mapMidnightParameterTypeToFieldType` and `getMidnightCompatibleFieldTypes` mirroring EVM/Stellar patterns.
  - Wire adapter methods to use mapping functions.
- parsing
  - Implement `parseMidnightInput` per rules above; add thorough validation + descriptive errors.
- formatting
  - Ensure `formatMidnightTransactionData` covers arrays/object flows and preserves argument order.
- queries/results
  - Keep `convertValueToSerializable` and `formatMidnightFunctionResult` behavior; extend if needed.
- runtime secret
  - Ensure runtime-only field binding remains adapter-led and never persisted.

## Architecture constraints (do not break)

- Chain-agnostic UI and schema orchestration stay in shared layers; all Midnight specifics remain inside the adapter.
- No global polyfills or SDK patches outside adapter-led bootstrapping.
- The Builder asks the adapter for mapping, parsing, formatting, and execution; the adapter never leaks SDK-specific objects to the UI.

## Sources and in-repo references

- EVM mapping and parser:

`1:32:packages/adapter-evm/src/mapping/constants.ts`

`15:79:packages/adapter-evm/src/transform/input-parser.ts`

- Stellar mapping and parser usage:

`95:203:packages/adapter-stellar/src/mapping/type-mapper.ts`

`36:168:packages/adapter-stellar/src/transaction/formatter.ts`

- Midnight current implementations:

`1:103:packages/adapter-midnight/src/transaction/formatter.ts`

`1:10:packages/adapter-midnight/src/transform/input-parser.ts`

`1:57:packages/adapter-midnight/src/transform/output-formatter.ts`

`28:210:packages/adapter-midnight/src/transaction/providers.ts`

`42:306:packages/adapter-midnight/src/query/executor.ts`

- CLI schema model (types):

`290:332:midnight-deploy-cli/src/schema-local.ts`

If/when official Midnight type documentation is available, reconcile and extend the mapping accordingly (especially for fixed-size bytes, enums, and any address-like domain types exposed as function params).
