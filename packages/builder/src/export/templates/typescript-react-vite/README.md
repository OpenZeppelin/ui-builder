# UI Builder Generated App

{{ PROJECT_DESCRIPTION }}

This project was generated using the [OpenZeppelin UI Builder](https://builder.openzeppelin.com/).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Build the project (required for Tailwind CSS compilation):

   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

   > **Note:** This build step is required before running the development server due to how Tailwind CSS v4 processes styles. The build ensures all Tailwind utilities are properly compiled and available in your application.

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── public/               # Static assets
├── src/
│   ├── adapters/         # Blockchain adapter implementations
│   │   └── {{ CHAIN_TYPE }}/  # Chain-specific adapter code
│   ├── components/       # React components
│   │   └── GeneratedForm.tsx  # The main form component
│   ├── styles/           # CSS files
│   │   └── global.css    # Base global styles and theme variables
│   ├── types/            # TypeScript type definitions (if any)
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── styles.css        # Main CSS entry point (imports others)
├── components.json       # shadcn/ui component configuration
├── index.html            # HTML template
├── package.json          # Project dependencies and scripts
├── postcss.config.cjs    # PostCSS configuration (for Tailwind)
├── tailwind.config.cjs   # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Configuration Files

Several configuration files are included at the project root:

- **`tailwind.config.cjs`**: Configures Tailwind CSS (content paths, theme extensions).
- **`postcss.config.cjs`**: Configures PostCSS plugins (includes Tailwind).
- **`components.json`**: Configures `shadcn/ui` component generation (style, paths).
- **`vite.config.ts`**: Configures the Vite build tool.
- **`tsconfig.json`**: Configures the TypeScript compiler.

## Application Configuration (`app.config.json`)

This exported form application can be configured at runtime by creating a `public/app.config.json` file. An example file, `public/app.config.json.example`, is provided to guide you.

To configure your application:

1.  In the `public` directory of this exported project, **rename or copy `app.config.json.example` to `app.config.json`**.
2.  Open the new `public/app.config.json` file.
3.  Edit the file to provide your specific settings. Key sections include:
    - `networkServiceConfigs`: For API keys used by services like block explorers (e.g., Etherscan, PolygonScan). The relevant service identifier placeholder will be pre-filled based on the network this form was exported for.
    - `globalServiceConfigs`: For globally used service parameters, like the WalletConnect Project ID.
    - `rpcEndpoints`: To override the default RPC URL for the blockchain network this form targets. A placeholder for the exported network's ID will be present.

**Example content you might find in `public/app.config.json` (after renaming from example and before editing):**

```json
{
  "_readme": [
    "This is an example configuration file. To use it, rename this file to 'app.config.json' in the 'public' directory.",
    "Then, fill in your actual API keys and custom RPC URLs as needed.",
    "// The entry for 'etherscan-mainnet' is for the block explorer relevant to the network this form was exported for (Ethereum).", // Example note
    "API keys and other sensitive information should be managed securely."
  ],
  "networkServiceConfigs": {
    "_comment": "No specific block explorer API key is strictly required for the default functionality...",
    "etherscan-mainnet": {
      // Example if exported for Ethereum Mainnet
      "apiKey": "YOUR_ETHERSCAN_MAINNET_API_KEY_HERE",
      "_comment": "API key for the etherscan-mainnet block explorer..."
    }
  },
  "globalServiceConfigs": {
    "walletconnect": {
      "projectId": "YOUR_WALLETCONNECT_PROJECT_ID_HERE",
      "_comment": "WalletConnect Project ID, required if WalletConnect is used."
    }
  },
  "rpcEndpoints": {
    "ethereum-mainnet": "YOUR_ETHEREUM_MAINNET_RPC_URL_HERE_IF_NEEDED", // Example
    "_comment_for_ethereum-mainnet": "Optional: Provide a custom RPC URL..."
  },
  "featureFlags": {
    "exampleFeatureInExportedApp": true
  },
  "defaultLanguage": "en"
}
```

**Important:**

- Replace placeholder values (like `"YOUR_..._API_KEY_HERE"`) with your actual values in your `public/app.config.json`.
- The application will attempt to load `/app.config.json` when it starts. If this file is not found (e.g., you haven't renamed the example), or if specific settings are missing, the application will use default behaviors (like public RPCs) and some features (like WalletConnect or dynamic ABI loading) may be impaired or unavailable.

## Using the Form

The generated form can be imported and used in your components:

```tsx
import GeneratedForm from './components/GeneratedForm';

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
- [Transaction Renderer Documentation](https://github.com/OpenZeppelin/ui-builder)
