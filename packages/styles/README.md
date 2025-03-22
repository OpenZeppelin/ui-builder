# Centralized Styling System

This package contains the centralized styling system for the Transaction Form Builder monorepo. It uses Tailwind CSS 4.0 with OKLCH colors and follows the new-york style from shadcn/ui.

## Structure

- `global.css` - Main CSS file with theme variables and base styles that's shared across all packages
- `utils/` - Utility CSS files including auto-generated component styles
- `scripts/` - Scripts for generating component styles

# Data-Slot Style Generator

A solution for ensuring Tailwind properly processes classes across packages in a monorepo.

## Problem

In our Transaction Form Builder monorepo, components from the form-renderer package are imported into the core package. However, some Tailwind classes (especially those used in Radix UI components like `left-2` in select dropdowns) were not being applied correctly because Tailwind's purge process wasn't detecting these classes in the core package.

## Solution: Data-Slot Style Generator

A script that automatically extracts Tailwind classes from UI components with data-slot attributes and generates a CSS file with corresponding @apply directives.

### Benefits:

- Robust solution not affected by Tailwind's purging process
- Automatically extracts all component styles into a shared CSS
- Works with complex class combinations
- Only needs to run once before build/dev

### How It Works:

1. Scans all UI components for data-slot attributes
2. Extracts their Tailwind classes
3. Generates a CSS file with @apply directives
4. Makes styles available across all packages

## Usage

The script runs automatically before development and build:

```bash
# Already configured in package.json
pnpm dev  # Automatically runs the generator first
pnpm build  # Automatically runs the generator first
```

Or run it manually:

```bash
pnpm generate-data-slots
```

## Adding New Components

Simply use data-slot attributes in your components:

```jsx
<div data-slot="your-component" className="flex items-center gap-2">
  {...}
</div>
```

This makes your styling much more maintainable:

- Classes are applied consistently across the application
- Styling is centralized and reusable
- No need to worry about Tailwind purging your classes

## Implementation Details

The generator script:

1. Uses Babel to parse and traverse React components
2. Extracts the className props from elements with data-slot attributes
3. Handles both simple string literals and complex expressions
4. Generates a CSS file with [data-slot] selectors and corresponding @apply rules
5. Updates automatically before each build and development session

## Example Generated Output

```css
/* Auto-generated data-slot styles */
[data-slot='button'] {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50;
}

[data-slot='input'] {
  @apply border-input bg-background ring-offset-background focus-visible:ring-ring placeholder:text-muted-foreground h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50;
}
```

## License

MIT

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
