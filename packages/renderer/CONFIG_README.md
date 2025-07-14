# Configuration Files

## Symlinked Files

The following files in this directory are symlinks to the root configuration files:

- `postcss.config.cjs` - PostCSS configuration
- `tailwind.config.cjs` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration

## Important

**DO NOT edit these files directly** as they are symlinks to the root configuration files.

Instead, edit the source files at the root of the monorepo and run `pnpm create-symlinks` to update all copies.

This ensures consistent configuration across all packages in the monorepo.
