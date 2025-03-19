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
│   │   └── stellar/  # Stellar blockchain adapter
│   ├── services/     # Core services
│   ├── test/         # Test setup and utilities
│   ├── mocks/        # Mock data for development and testing
│   ├── App.tsx       # Main application component
│   ├── main.tsx      # Application entry point
│   └── index.css     # Global styles with Tailwind
├── index.html        # HTML template
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── ...               # Other configuration files
```

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

This architecture allows for easy extension to support additional blockchain ecosystems without modifying the core application logic.

For more detailed documentation about the adapter pattern and implementation guidelines, see the [Adapter System documentation](./src/adapters/README.md).
