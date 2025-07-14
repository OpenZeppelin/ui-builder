# Code Templates

This directory contains template files used by the FormCodeGenerator to generate code.

## Template Syntax

The templating system supports three placeholder formats:

### 1. Variable Placeholders: `@@param-name@@`

The primary format for regular replacements in text, using kebab-case. These placeholders are completely replaced with their values:

```tsx
import { @@adapter-class-name@@ } from '../adapters/@@ecosystem@@/adapter';
// ↓ Becomes ↓
import { EvmAdapter } from '../adapters/evm/adapter';
```

### 2. JSX Comment Placeholders: `{/*@@param-name@@*/}`

Special format for JSX attributes and elements wrapped in comment syntax. During initial processing, these preserve the comment syntax:

```tsx
<Button
  onClick={/*@@on-click-handler@@*/}
  className={/*@@button-class-name@@*/}
>
  {/*@@button-text@@*/}
</Button>
// ↓ Initial template processing ↓
<Button
  onClick={/*() => console.log("clicked")*/}
  className={/*primary-button*/}
>
  {/*Submit Transaction*/}
</Button>
```

### 3. Inline Comment Placeholders: `/*@@param-name@@*/`

For inline comments within code, useful for variable assignments. These also initially preserve the comment syntax:

```tsx
const adapter = new /*@@adapter-class-name@@*/();
// ↓ Initial template processing ↓
const adapter = new /*EvmAdapter*/();
```

## Template Processing Pipeline

The FormCodeGenerator processes templates in a two-phase approach:

### 1. Initial Processing (`processTemplate` method):

- Replaces variable placeholders with values
- Replaces comment-based placeholders while preserving comment syntax
- Converts kebab-case parameters to camelCase for lookup

### 2. Post-Processing (`applyCommonPostProcessing` method):

- Removes template-specific comments between designated markers
- Removes `@ts-expect-error` comments
- Applies template-specific transformations as needed

This approach ensures templates remain valid TypeScript during development while producing clean, functional code when generated.

## Common Post-Processing

The FormCodeGenerator applies a unified post-processing approach to all templates:

- **Removing template-specific comments**: All content between `/*------------TEMPLATE COMMENT START------------*/` and `/*------------TEMPLATE COMMENT END------------*/` markers is removed.
- **Removing development comments**: All lines containing `@ts-expect-error` are removed.
- **Replacing Adapter Placeholders**: Replaces `AdapterPlaceholder` class name and `'@@adapter-package-name@@'` import paths with the correct values based on the selected chain.

## Template-Specific Post-Processing

For form component templates (`form-component.template.tsx`):

- Form schema JSON injection (`formConfigJSON`).
- Execution configuration JSON injection (`executionConfigJSON`).

## Automatic Parameter Name Conversion

When using any of these template formats, kebab-case is automatically converted to camelCase in the parameter lookup:

- `@@adapter-class-name@@` → looks up `params.adapterClassName`
- `@@ecosystem@@` → looks up `params.ecosystem`

## Important Notes

### Template-Specific Comments

You can include comments that will be removed during post-processing using delimited comment blocks:

```tsx
/*------------TEMPLATE COMMENT START------------*/
// This comment block will be removed from the generated code.
// Use it for documenting the template itself.
/*------------TEMPLATE COMMENT END------------*/
```

## Available Templates

- **`main.template.tsx`**: Template for the application entry point (`src/main.tsx`).
- **`app-component.template.tsx`**: Template for generating the main App component (`src/App.tsx`).
- **`form-component.template.tsx`**: Template for generating the specific form component (`src/components/GeneratedForm.tsx`).

## Template Parameters

Each template has specific parameters defined in `TemplateTypes.ts`:

### `MainTemplateParams`

- `adapterClassName`: The class name of the adapter (e.g., 'EvmAdapter').
- `adapterPackageName`: The npm package name for the adapter.

### `AppComponentTemplateParams`

- `functionId`: The function ID (e.g., 'transferTokens').
- `currentYear`: The current year for copyright notices.
- `adapterClassName`: (Passed for common post-processing).
- `adapterPackageName`: (Passed for common post-processing).

### `FormComponentTemplateParams`

- `adapterClassName`: The class name of the adapter.
- `adapterPackageName`: The npm package name for the adapter.
- `ecosystem`: The ecosystem (e.g., 'evm').
- `functionId`: The function ID.
- `formConfigJSON`: The generated `RenderFormSchema` as a JSON string.
- `executionConfigJSON`: The selected execution config as a JSON string or 'undefined'.
- `includeDebugMode`: Optional flag to include debug mode.

## Adding New Templates

1. Create a new file following the naming convention: `[name].template.tsx`
2. Use any of the supported placeholder formats (variable, JSX comment, or inline comment)
3. Create corresponding parameter types in `TemplateTypes.ts`
4. Update the FormCodeGenerator to support the new template and add any necessary post-processing steps

### `form-component.template.tsx`

Generates the main `GeneratedForm.tsx` component in the exported application. This component wraps the `@openzeppelin/contracts-ui-builder-renderer`'s `TransactionForm`.

**Key Injections:**

- Adapter import path and class name (e.g., `EvmAdapter` from `@openzeppelin/contracts-ui-builder-adapter-evm`).
- `RenderFormSchema` JSON (`formSchema`).
- `ContractSchema` JSON (`contractSchema`).
- `ExecutionConfig` JSON (`executionConfig`).

This template is responsible for setting up the form with the correct schema and adapter, and integrating the `ContractStateWidget`.

### `app-component.template.tsx`

### Available Template Variables for `processTemplate`

The `processTemplate` method uses a simple `@@variable-name@@` syntax. The `TemplateProcessor` converts `variable-name` (kebab-case) to `variableName` (camelCase) when looking up values in the provided parameters object.

**Commonly used variables:**

- `adapter-package-name`: e.g., `@openzeppelin/contracts-ui-builder-adapter-evm`
- `adapter-class-name`: e.g., `EvmAdapter`
- `chain-name`: e.g., `Ethereum`
- `default-network-json`: JSON string of the default `NetworkConfig` for the selected chain.
- `ecosystem-identifier`: e.g., `evm`
- `function-id`: The unique ID of the function the form is for.
- `app-title`: Title for the generated application.

### Post-Processing Injections (`applyCommonPostProcessing`)

After initial template variable replacement, `applyCommonPostProcessing` handles more complex injections:

- Adapter class name (again, to catch specific placeholders like `AdapterPlaceholder`).
- Network config import name (e.g., `mainnet`, `sepolia`).
- `RenderFormSchema` JSON injection (`formSchema`).
- `ContractSchema` JSON injection (`contractSchema`).
- `ExecutionConfig` JSON injection (`executionConfig`).

This method also cleans up template comments and formats the code using Prettier.

### Available Template Variables for `generate` method

When using the `generate` method of the `FormCodeGenerator` class, you can provide the following parameters in the `options` object. These are used to inject data into the code templates.

- `adapterPackageName`: The npm package name of the adapter (e.g., `@openzeppelin/contracts-ui-builder-adapter-evm`).
- `adapterClassName`: The class name of the adapter (e.g., `EvmAdapter`).
- `chainName`: The user-friendly name of the chain (e.g., `Ethereum Mainnet`).
- `defaultNetworkJson`: A JSON string representing the default `NetworkConfig` for the selected chain.
- `ecosystemIdentifier`: The ecosystem identifier (e.g., `evm`).
- `functionId`: The function ID.
- `formConfigJSON`: The generated `RenderFormSchema` as a JSON string.
- `executionConfigJSON`: The selected execution config as a JSON string or 'undefined'.
- `includeDebugMode`: Optional flag to include debug mode.
