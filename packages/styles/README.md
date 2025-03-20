# Centralized Styling System

This package contains the centralized styling system for the Transaction Form Builder monorepo. It uses Tailwind CSS 4.0 with OKLCH colors and follows the new-york style from shadcn/ui.

## Structure

- `global.css` - Main CSS file with theme variables and base styles that's shared across all packages

## Usage

All packages in the monorepo share this styling system through imports and symbolic links:

1. Configuration files at the repo root:

   - `tailwind.config.cjs` - Central Tailwind configuration
   - `postcss.config.cjs` - Central PostCSS configuration
   - `components.json` - Central shadcn/ui configuration

2. Each package symbolically links to these central configuration files

3. Each package imports the central CSS with proper import order:
   ```css
   @import 'tailwindcss';
   @import '../../../packages/styles/global.css';
   ```

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
