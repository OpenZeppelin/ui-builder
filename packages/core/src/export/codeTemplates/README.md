# Code Templates

This directory contains template files used by the FormCodeGenerator to generate code.

## Template Syntax

Templates use a simple placeholder syntax: `${{paramName}}` which will be replaced with the corresponding value from the parameters object:

```tsx
// Example template with placeholders
import { ${{adapterClassName}} } from '../adapters/${{chainType}}/adapter';

function ExampleComponent() {
  return <h1>${{title}}</h1>;
}
```

## Important Notes

### Prettier Formatting

**Note**: When editing template files in an IDE with Prettier enabled, the formatting will automatically add spaces inside the template placeholders, changing them from `${{paramName}}` to `${{ paramName }}`. This is expected and supported.

The template processor uses a regex that handles both formats:

```typescript
template.replace(/\$\{\{\s*(\w+)\s*\}\}/g, (_, paramName) => {
  // Replacement logic
});
```

### Template Type Declaration

To help TypeScript understand the template syntax, we've added a custom type declaration in `template.d.ts`. This helps prevent TypeScript errors for the custom syntax.

## Available Templates

- **form-component.template.tsx**: Template for generating a form component
- **app-component.template.tsx**: Template for generating the main App component

## Adding New Templates

1. Create a new file following the naming convention: `[name].template.tsx`
2. Use the `${{paramName}}` syntax for placeholders
3. Create corresponding parameter types in `TemplateTypes.ts`
