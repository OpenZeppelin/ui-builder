# Export Templates

This package contains templates for exporting transaction forms as standalone applications.

## Available Templates

### TypeScript React Vite

A template for React applications using TypeScript and Vite. This is the primary template used for exporting forms.

```
typescript-react-vite/
├── public/           # Static assets
├── src/
│   ├── components/   # React components (including the generated form)
│   ├── adapters/     # Blockchain adapters
│   ├── main.tsx      # Application entry point
│   └── styles.css    # Global styles
├── index.html        # HTML template
└── README.md         # Template documentation
```

See the [TypeScript React Vite README](./typescript-react-vite/README.md) for more details.

### Future Templates

These templates are planned for future implementation:

- JavaScript React Vite
- TypeScript Next.js
- React Native

## Usage

These templates are used by the Transaction Form Builder's export system to generate standalone applications from form schemas. They are not meant to be used directly, but rather through the export functionality of the main application.

When a user exports a form, the system:

1. Selects an appropriate template
2. Generates form-specific code
3. Adds the necessary adapters
4. Bundles everything into a downloadable package

## Development

To modify or add templates:

1. Create a new directory with the template name (e.g., `javascript-react-vite`)
2. Add all necessary files for a complete, runnable application
3. Include placeholders where generated code will be inserted
4. Add appropriate documentation in a README.md file

### Testing Templates

To test a template:

```bash
# Navigate to the template directory
cd packages/templates/typescript-react-vite

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```
