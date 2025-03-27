# Transaction Form Builder - Export System

## Overview

The Export System is a key component of the Transaction Form Builder that allows users to export customized blockchain transaction forms as standalone applications. It generates complete, ready-to-use React applications that implement the user's form configuration using the shared form-renderer package.

## Architecture

The export system follows a modular architecture with several specialized components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ FormExportSystem│────▶│TemplateProcessor│────▶│  TemplateManager│
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │                                               ▲
         │                                               │
         ▼                                               │
┌─────────────────┐     ┌─────────────────┐     ┌───────┴───────┐
│FormCodeGenerator│────▶│AdapterExportMgr │────▶│ PackageManager│
└─────────────────┘     └─────────────────┘     └───────────────┘
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │ ZipGenerator  │
                                                └───────────────┘
```

### Key Components

1. **FormExportSystem**: The main orchestrator that coordinates the entire export process.
2. **FormCodeGenerator**: Generates React components that use the shared form-renderer package.
3. **TemplateManager**: Manages template files for different project types.
4. **TemplateProcessor**: Processes code templates with placeholder substitution.
5. **AdapterExportManager**: Provides adapter files for the selected blockchain.
6. **PackageManager**: Manages dependencies for the exported project.
7. **ZipGenerator**: Creates a downloadable ZIP file of the project.

## Schema Transformation

The export system uses the FormSchemaFactory's `builderConfigToRenderSchema` method to ensure consistency between form preview and export. This transformation:

1. Converts the builder configuration (BuilderFormConfig) to a render schema (RenderFormSchema)
2. Ensures all required properties are present (id, title, submitButton, etc.)
3. Provides uniform behavior between preview and exported forms

A validation step verifies that all required schema properties are present before code generation, preventing potential runtime errors in exported forms.

## Export Process Flow

1. User initiates export with a form configuration, chain type, and function ID
2. FormCodeGenerator creates form components using the template system
3. AdapterExportManager provides blockchain-specific adapter files
4. TemplateManager creates a complete project structure using one of the available templates
5. PackageManager adds appropriate dependencies to package.json
6. ZipGenerator bundles everything into a downloadable ZIP file
7. The completed ZIP is returned to the user

## Template System

The template system uses real code files as templates instead of string literals, providing several benefits:

1. **IDE Support**: Full syntax highlighting, error checking, and auto-completion during development
2. **Maintainability**: Templates are actual TypeScript/React files, not string literals
3. **Type Safety**: Templates use TypeScript interfaces for parameters

### Template Files

Templates are stored in two locations:

- `/codeTemplates`: Contains component templates (form-component.template.tsx, app-component.template.tsx)
- `/templates`: Contains complete project templates (typescript-react-vite)

### Placeholder Syntax

Templates use a consistent placeholder syntax:

1. **Regular Placeholders**: `@@param-name@@`
2. **JSX Comment Placeholders**: `{/*@@param-name@@*/}`
3. **Inline Comment Placeholders**: `/*@@param-name@@*/`

Example:

```tsx
// Title with regular placeholder
<h2>Transaction Form for @@function-id@@</h2>

// JSX placeholder for React component
import { {/*@@adapter-class-name@@*/} } from '../adapters/@@chain-type@@/adapter';

// Inline comment placeholder
const adapter = new /*@@adapter-class-name@@*/();
```

## Code Generation

The code generation system produces:

1. **Form Component**: A React component that renders the transaction form
2. **App Component**: An updated App component that imports the form
3. **Adapter Files**: Blockchain-specific adapter implementation

### Form Component Generation

The FormCodeGenerator creates a form component that:

- Imports the TransactionForm component from the form-renderer package
- Uses the appropriate blockchain adapter
- Includes the form schema with all fields and validation
- Handles form submission and error states

## Package Management

The PackageManager handles dependency management for exported projects:

1. **Core Dependencies**: Always included (React, form-renderer package)
2. **Chain-specific Dependencies**: Based on the selected blockchain (ethers for EVM, etc.)
3. **Field-specific Dependencies**: Based on the field types used in the form

Configurations are loaded automatically at build time from:

- `/adapters/*/config.ts`: For chain-specific dependencies
- `/form-renderer/src/config.ts`: For field-specific dependencies

## Export Options

The export system supports various options:

- **template**: Template to use (default: 'typescript-react-vite')
- **projectName**: Custom name for the project
- **description**: Project description
- **includeAdapters**: Whether to include adapter files (default: true)
- **onProgress**: Callback for progress updates during export

## Usage

```typescript
const exportSystem = new FormExportSystem();

// Export a form
const result = await exportSystem.exportForm(
  formConfig, // Form configuration from the builder
  'evm', // Chain type
  'transferTokens', // Function ID
  {
    projectName: 'My Token Transfer Form',
    description: 'A form for transferring ERC20 tokens',
  }
);

// Result contains:
// - zipBlob: The generated ZIP file
// - fileName: Suggested filename for the ZIP
// - dependencies: List of dependencies used
```

## Adding New Templates

To add a new template:

1. Create a new directory in `/templates` (e.g., `/templates/typescript-next-app`)
2. Add all necessary files for a working project
3. Use placeholder syntax where dynamic content is needed
4. Update template documentation

## Adding New Blockchain Support

To support a new blockchain:

1. Create a new adapter implementation in `/adapters/your-chain`
2. Create a configuration file at `/adapters/your-chain/config.ts`
3. Define runtime and development dependencies in the config
4. Add adapter-specific template modifications if needed

## Testing

The export system includes comprehensive testing:

- Unit tests for individual components
- Integration tests for the complete export process
- Mock configurations for testing different scenarios

Run tests with:

```bash
pnpm test:export
```

## Troubleshooting

Common issues:

1. **Missing dependencies**: Check adapter and form-renderer configurations
2. **Template not found**: Ensure the template exists in the templates directory
3. **Export failures**: Check console for detailed error messages

## Future Enhancements

Planned improvements:

- Support for more project templates (Next.js, Vue, etc.)
- Advanced customization options (theme, styling, etc.)
- Framework-specific adapter optimizations
- Live preview of exported projects
