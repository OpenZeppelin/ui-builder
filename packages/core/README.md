# Transaction Form Builder Core

The main application for the Transaction Form Builder monorepo. This package contains the form builder UI, adapters for different blockchain ecosystems, and core functionality.

## Structure

```
core/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # shadcn/ui components
│   │   ├── Common/   # Shared components across features
│   │   └── FormBuilder/ # Form builder components
│   ├── core/         # Chain-agnostic core functionality
│   │   ├── types/    # Type definitions
│   │   ├── utils/    # Utility functions
│   │   ├── hooks/    # Shared hooks
│   │   └── factories/ # Schema factories
│   ├── adapters/     # Chain-specific implementations
│   │   ├── evm/      # Ethereum Virtual Machine adapter
│   │   ├── midnight/ # Midnight blockchain adapter
│   │   ├── solana/   # Solana blockchain adapter
│   │   ├── stellar/  # Stellar blockchain adapter
│   ├── export/       # Export system
│   │   ├── generators/ # Form code generators
│   │   ├── codeTemplates/ # Code template files for generation
│   │   ├── templates/ # Base project structures for export
│   │   │   ├── typescript-react-vite/ # React + Vite template structure
│   │   │   └── ...   # Future template structures
│   │   ├── cli/      # CLI tool for exporting
│   │   └── ...       # Other export utilities
│   ├── services/     # Core services
│   ├── stories/      # Centralized Storybook stories
│   │   ├── common/   # Stories for common components
│   │   ├── form-builder/ # Stories for form builder components
│   │   └── ui/       # Stories for UI components
│   ├── test/         # Test setup and utilities
│   ├── mocks/        # Mock data for development and testing
│   ├── App.tsx       # Main application component
│   ├── main.tsx      # Application entry point
│   └── index.css     # Imports centralized styling from styles package
├── index.html        # HTML template
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── ...               # Other configuration files
```

## Styling

This package uses the centralized styling system from the `packages/styles` package:

- **CSS Variables**: Direct OKLCH color values define the theme colors
- **Tailwind CSS 4.0**: Modern utility-first CSS with the latest features
- **Component Library**: Built on shadcn/ui with consistent, accessible components
- **Dark Mode**: Built-in dark mode support

For more details on the styling system, see the [Styles README](../styles/README.md).

## Development

### Running the Core Application

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core dev

# Or from within the core package directory
pnpm dev
```

### Building

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core build

# Or from within the core package directory
pnpm build
```

### Testing

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core test

# Or from within the core package directory
pnpm test
```

## Architecture

The core package uses an adapter pattern to support multiple blockchain ecosystems:

- **Core**: Chain-agnostic components, types, and utilities
- **Adapters**: Chain-specific implementations that conform to a common interface
- **UI Components**: React components that use adapters to interact with different blockchains
- **Styling System**: Centralized CSS variables and styling approach from the styles package

This architecture allows for easy extension to support additional blockchain ecosystems without modifying the core application logic.

For more detailed documentation about the adapter pattern and implementation guidelines, see the [Adapter System documentation](./src/adapters/README.md).
