# Transaction Form

{{ PROJECT_DESCRIPTION }}

This project was generated using the [OpenZeppelin Transaction Form Builder](https://transaction-form-builder.openzeppelin.com/).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

3. Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

## Project Structure

```
├── public/               # Static assets
├── src/
│   ├── adapters/         # Blockchain adapter implementations
│   │   └── {{ CHAIN_TYPE }}/  # Chain-specific adapter code
│   ├── components/       # React components
│   │   └── GeneratedForm.tsx  # The main form component
│   └── types/            # TypeScript type definitions
└── package.json          # Project dependencies and scripts
```

## Using the Form

The generated form can be imported and used in your components:

```tsx
import { GeneratedForm } from './components/GeneratedForm';

function App() {
  const handleSubmit = async (values) => {
    // Handle form submission
    console.log('Form values:', values);
    // Process transaction with the adapter
  };

  return (
    <div>
      <h1>My Transaction Form</h1>
      <GeneratedForm onSubmit={handleSubmit} />
    </div>
  );
}
```

## Customizing the Form

You can customize the form by:

1. Editing the `GeneratedForm.tsx` component
2. Styling with Tailwind CSS or your preferred styling solution
3. Adding validation rules to the form fields
4. Extending the adapter functionality for your specific needs

## Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

This will create a production-ready build in the `dist/` directory.

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Transaction Form Renderer Documentation](https://github.com/OpenZeppelin/transaction-form-builder)
