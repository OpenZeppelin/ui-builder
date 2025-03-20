# Transaction Form Application

This application was generated with [OpenZeppelin Transaction Form Builder](https://github.com/OpenZeppelin/transaction-form-builder).

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn

# Using pnpm
pnpm install
```

2. Start the development server:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To build the application for production:

```bash
# Using npm
npm run build

# Using yarn
yarn build

# Using pnpm
pnpm build
```

The built files will be in the `dist` directory.

## Customizing the Form

The form is defined in `src/components/GeneratedForm.tsx` and uses the form schema that was generated during export. You can customize the form's appearance and behavior by editing this file.

## Styling

This application includes a modern styling system:

- **Tailwind CSS**: A utility-first CSS framework
- **CSS Variables**: Custom properties for theming with OKLCH colors
- **Dark Mode**: Built-in support for light and dark themes
- **Form Component Styling**: Consistent spacing and layout for form elements

You can customize the styling by:

1. Editing `src/styles.css` to change global styles and variables
2. Modifying `tailwind.config.js` to adjust Tailwind settings
3. Adding or changing component styles in the components directory

The styling system is based on the Transaction Form Builder's design system, which ensures consistency and accessibility.

## Form Renderer

This application uses the `@openzeppelin/transaction-form-renderer` package to render the form. For more information, see the [documentation](https://github.com/OpenZeppelin/transaction-form-builder).
