# @openzeppelin/contracts-ui-builder-ui

This package provides a comprehensive set of shared React UI components for the OpenZeppelin Transaction Form Builder ecosystem. It serves as the central library for all common UI elements, including basic primitives, form field components, and their associated utilities.

## Overview

The primary goal of `@openzeppelin/contracts-ui-builder-ui` is to ensure UI consistency, maintainability, and reusability across the various parts of the Transaction Form Builder, such as `@openzeppelin/transaction-form-builder` and `@openzeppelin/contracts-ui-builder-renderer` and adapter packages.

All components are built with React, TypeScript, and styled with Tailwind CSS, following the shadcn/ui patterns and design principles established in the root configuration of the monorepo.

## Key Component Categories

This package includes, but is not limited to:

- **Basic UI Primitives**: `Button`, `LoadingButton`, `Input`, `Label`, `Textarea`, `Card` (and its parts), `Dialog` (and its parts), `Alert` (and its parts), `Checkbox`, `RadioGroup`, `Select` (and its parts), `Progress`, `Tabs`, `Tooltip`, etc.
- **Field Components**: These are specialized components designed for use within `react-hook-form` and are typically rendered via `DynamicFormField` in `@openzeppelin/contracts-ui-builder-renderer`.
  - `AddressField`
  - `AmountField`
  - `BaseField` (a foundational component for creating new field types)
  - `BooleanField`
  - `NumberField`
  - `RadioField`
  - `SelectField`
  - `SelectGroupedField`
  - `TextAreaField`
  - `TextField`
- **Field Utilities**: Helper functions for validation, accessibility, and layout within field components.
- **Styling Utilities**: Such as `buttonVariants` for `class-variance-authority`.

## Usage

Components and utilities can be imported directly from this package:

```tsx
import { Control, useForm } from 'react-hook-form';

import { Button, TextField, type TextFieldProps } from '@openzeppelin/contracts-ui-builder-ui';

interface MyFormData {
  name: string;
}

function MyCustomForm() {
  const { control } = useForm<MyFormData>();

  return (
    <form className="space-y-4">
      <TextField
        id="name"
        name="name" // Make sure 'name' is a valid FieldPath<MyFormData>
        label="Full Name"
        control={control as Control<FieldValues>}
        placeholder="Enter your full name"
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Styling

Components are styled using Tailwind CSS. The necessary Tailwind configuration (including theme, plugins) is expected to be present in the consuming application, typically by presetting from the monorepo's root `tailwind.config.cjs`. The UI package itself does not bundle CSS but provides the class names and structure.

## Storybook

Component examples and variations can be explored via Storybook by running `pnpm storybook` from the monorepo root and navigating to the components under the "UI" or similar section.
