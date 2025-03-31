# Centralized Styling System

This package contains the centralized styling system for the Transaction Form Builder monorepo. It uses Tailwind CSS 4.0 with OKLCH colors and follows the new-york style from shadcn/ui.

## Structure

- `global.css` - Main CSS file with theme variables and base styles that's shared across all packages.
- `utils/` - Utility CSS files (if any).
- `scripts/` - Scripts related to styling (if any).

## Styling Approach

This monorepo utilizes a consistent styling approach:

1. **Centralized Configuration:** `tailwind.config.cjs`, `postcss.config.cjs`, and `components.json` are located at the monorepo root and symlinked into relevant packages.
2. **Package-Specific Builds:** Each package using Tailwind (`core`, `form-renderer`, export templates) includes a build step (`tailwindcss -i ... -o ...`) to compile its own CSS, ensuring all necessary styles are included.
3. **CSS Imports:** Packages import the pre-compiled CSS from their dependencies (e.g., `core` imports `form-renderer/dist/index.css`). This guarantees styles from dependencies are available.
4. **Shared Global Styles:** `global.css` defines theme variables (OKLCH colors, radius, etc.) and base styles, and is imported by packages.
5. **Tailwind Content Scanning:** The root `tailwind.config.cjs` scans source files across relevant packages to provide context for Tailwind's JIT engine.

This setup ensures styles are consistently applied, even for components rendered in Portals (like Radix UI primitives), by relying on explicit CSS builds and imports rather than solely on JIT scanning across package boundaries during development.

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
symlink-based configuration approach for consistency:

### Root Configuration Files

The root directory contains these key configuration files:

- **tailwind.config.cjs**: Shared Tailwind configuration with CSS variable-based theming
- **postcss.config.cjs**: Shared PostCSS configuration for processing
- **components.json**: Shared shadcn/ui component configuration

### Package Integration

Each package has symbolic links to these root configurations, ensuring consistent styling and behavior:

```
packages/core/tailwind.config.cjs -> ../../tailwind.config.cjs
packages/form-renderer/tailwind.config.cjs -> ../../tailwind.config.cjs
```

### Exported Templates

During the export process:

1. Template files in the core package are used to create standalone projects
2. Symlinks are resolved to create standalone configuration files
3. The styles from this package are included in the exported project
4. The result is a self-contained project with proper styling

## Utilities

(Add details about any utility functions or components provided by this package if applicable)

```

```
