# Transaction Form Export CLI

This is the command-line tool for exporting, building, and testing transaction forms.

## Documentation

For complete documentation on using this CLI tool, please refer to:

- [Export CLI Tool Documentation](../../../docs/export-cli-tool.md)

## Quick Reference

```bash
# Display help
export-form --help

# Export a form
export-form export [options]

# Build an exported form
export-form build <directory>

# Serve an exported form
export-form serve <directory>

# Verify an exported form
export-form verify <directory>
```

## Development

This CLI tool is implemented using CommonJS to ensure compatibility with node environments. The main entry point is `export-form.cjs` which is referenced in the package.json `bin` field to make it available as a CLI command.

For development and maintenance, please follow the project's contribution guidelines.
