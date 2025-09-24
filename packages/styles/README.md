# Centralized Styling System

This package contains the centralized styling system for the UI Builder monorepo. It uses Tailwind CSS 4.0 with OKLCH colors and follows the new-york style from shadcn/ui.

## Package Structure

```text
styles/
├── src/                        # Source stylesheets and utilities
├── global.css                  # Main CSS file with theme variables and base styles
├── package.json                # Package configuration
├── tsconfig.json               # TypeScript configuration
├── tsup.config.ts              # Build configuration
└── README.md                   # This documentation
```

## Key Files

- `global.css` - Main CSS file with theme variables and base styles that's shared across all packages.
- `src/utils/` - Utility CSS files and styling functions (if any).
- Configuration is centralized at the repo root and consumed by packages via lightweight JS proxy configs and copied JSON to ensure consistency.

## Styling Approach

This monorepo utilizes a consistent styling approach driven by the consuming application:

1.  **Centralized Theme:** This `@styles` package provides the single source of truth for theme variables (colors, spacing, radius) and base styles in `global.css`.
2.  **Centralized Configuration:** Root-level `tailwind.config.cjs`, `postcss.config.cjs`, and `components.json` are consumed by packages using:
    - package-level JS proxy configs (`tailwind.config.cjs`, `postcss.config.cjs`) that `require('../../...')`
    - a per-package `components.json` file (regular JSON, not a symlink)
3.  **Consumer-Driven Build:** The main application (`packages/builder`) or exported applications are responsible for the Tailwind CSS build process.
4.  **Automatic Content Scanning:** Tailwind v4 automatically scans the source code of the application _and its dependencies_ (like `@openzeppelin/ui-builder-ui` and `@openzeppelin/ui-builder-renderer`) for utility class usage.
5.  **CSS Generation:** The consumer app's build generates the final CSS file, including base styles from `global.css`, theme variables, and all necessary utility classes used throughout the application and its dependencies.

**Key Point:** Library packages like `renderer` and `ui` do **not** build or ship their own CSS. Styling is entirely managed by the final application build, ensuring consistency and leveraging the shared theme from this `@styles` package.

## Features

- **Tailwind CSS 4.0**: Using the latest Tailwind features including native cascade layers and OKLCH colors
- **Direct OKLCH color values**: Variables use OKLCH values directly without nested references for simplicity
- **Unified theming**: Consistent design tokens across all packages
- **Dark mode support**: Built-in dark mode with proper variable handling
- **Shadcn/ui integration**: Configured for the new-york style

## CSS Variables

The system uses CSS variables for all theme colors and properties. These variables are defined directly with OKLCH values for better readability and maintenance:

```css
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... other variables */
}
```

## Form Component Spacing

Form components follow our design system with consistent spacing:

- `flex flex-col gap-2` - Used for form fields to create proper spacing between label and input
- `space-y-4` - Used for spacing between form fields in a group
- `space-y-6` - Used for spacing between form sections

## Adding New Components

When adding new shadcn/ui components, use the root components.json config:

```bash
pnpm ui:add button
```

This ensures all components follow the same unified styling approach.

## Configuration Architecture

This package provides centralized styling utilities and components used across all packages in the monorepo. The project uses a
proxy-config approach (no symlinks) for consistency:

### Root Configuration Files

The root directory contains these key configuration files:

- **tailwind.config.cjs**: Shared Tailwind configuration with CSS variable-based theming
- **postcss.config.cjs**: Shared PostCSS configuration for processing
- **components.json**: Shared shadcn/ui component configuration

### Package Integration

Packages that contain UI elements needing Tailwind processing (like `builder`, `renderer`, and `ui`) include:

- `tailwind.config.cjs` and `postcss.config.cjs` as simple JS proxies that `require('../../tailwind.config.cjs')` and `require('../../postcss.config.cjs')`
- a local `components.json` that points to the package's CSS entry (e.g., `../styles/global.css`)

### Exported Templates

During the export process:

1. Template files in the builder package are used to create standalone projects
2. Proxy configs and JSON are copied as needed to create standalone configuration files
3. The styles from this package are included in the exported project
4. The result is a self-contained project with proper styling

## Utilities

(Add details about any utility functions or components provided by this package if applicable)
