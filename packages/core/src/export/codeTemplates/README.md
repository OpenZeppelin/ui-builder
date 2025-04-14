# Code Templates

This directory contains template files used by the FormCodeGenerator to generate code.

## Template Syntax

The templating system supports three placeholder formats:

### 1. Variable Placeholders: `@@param-name@@`

The primary format for regular replacements in text, using kebab-case. These placeholders are completely replaced with their values:

```tsx
import { @@adapter-class-name@@ } from '../adapters/@@chain-type@@/adapter';
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

- **Removing template-specific comments**: All content between `/*------------TEMPLATE COMMENT START------------*/` and `/*------------TEMPLATE COMMENT END------------*/` markers is removed
- **Removing development comments**: All lines containing `@ts-expect-error` are removed

## Template-Specific Post-Processing

For form component templates:

- Adapter class name replacement
- Fixing imports containing comment-based placeholders
- Form schema JSON injection

## Automatic Parameter Name Conversion

When using any of these template formats, kebab-case is automatically converted to camelCase in the parameter lookup:

- `@@adapter-class-name@@` → looks up `params.adapterClassName`
- `@@chain-type@@` → looks up `params.chainType`

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

- **form-component.template.tsx**: Template for generating a form component that handles form rendering and submission
- **app-component.template.tsx**: Template for generating the main App component that integrates the form

## Template Parameters

Each template has specific parameters defined in `TemplateTypes.ts`:

### FormComponentTemplateParams

- `adapterClassName`: The class name of the blockchain adapter to use (e.g., 'EvmAdapter')
- `chainType`: The blockchain type (e.g., 'evm', 'solana')
- `functionId`: The function ID (e.g., 'transferTokens')
- `formConfigJSON`: The form configuration as a JSON string
- `includeDebugMode`: Optional flag to include debug mode

### AppComponentTemplateParams

- `functionId`: The function ID (e.g., 'transferTokens')
- `currentYear`: The current year for copyright notices

## Adding New Templates

1. Create a new file following the naming convention: `[name].template.tsx`
2. Use any of the supported placeholder formats (variable, JSX comment, or inline comment)
3. Create corresponding parameter types in `TemplateTypes.ts`
4. Update the FormCodeGenerator to support the new template and add any necessary post-processing steps
