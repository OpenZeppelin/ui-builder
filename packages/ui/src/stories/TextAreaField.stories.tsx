import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { TextAreaField } from '../components/fields/TextAreaField';
import type { TextAreaFieldProps } from '../components/fields/TextAreaField';

// Extended props for the wrapper component
interface TextAreaFieldWrapperProps extends Omit<TextAreaFieldProps, 'control'> {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const TextAreaFieldWrapper = (args: TextAreaFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
    mode: 'all', // Validate on all events for immediate feedback
  });

  // If showError is true, manually set an error
  if (args.showError) {
    setTimeout(() => {
      methods.setError(args.name, {
        type: 'manual',
        message:
          args.showError === true
            ? 'This field has an error'
            : typeof args.showError === 'string'
              ? args.showError
              : 'Validation failed',
      });
    }, 100);
  }

  // Force immediate validation for required fields and other validations
  if (
    (args.validation?.required && !args.defaultValue) ||
    (args.maxLength && args.defaultValue && args.defaultValue.length > args.maxLength)
  ) {
    setTimeout(() => {
      methods.trigger(args.name);
    }, 100);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <TextAreaField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/TextAreaField',
  component: TextAreaFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Initial value for the story',
    },
    showError: {
      control: { type: 'boolean' },
      description: 'Whether to show an error state',
    },
    rows: {
      control: { type: 'number', min: 2, max: 10 },
      description: 'Number of rows in the textarea',
    },
    maxLength: {
      control: { type: 'number', min: 10, max: 500 },
      description: 'Maximum number of characters allowed',
    },
  },
} satisfies Meta<typeof TextAreaFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic textarea field
export const Basic: Story = {
  args: {
    id: 'basic-textarea',
    name: 'basicTextarea',
    label: 'Comments',
    placeholder: 'Enter your comments here',
    rows: 4,
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'textarea-helper',
    name: 'textareaHelper',
    label: 'Description',
    placeholder: 'Describe your project',
    helperText: 'Provide a detailed description of your project',
    rows: 5,
  },
};

// With default value
export const WithDefaultValue: Story = {
  args: {
    id: 'textarea-default',
    name: 'textareaDefault',
    label: 'Biography',
    placeholder: 'Tell us about yourself',
    defaultValue: 'I am a software developer with experience in React and TypeScript.',
    rows: 4,
  },
};

// With character limit
export const WithCharacterLimit: Story = {
  args: {
    id: 'textarea-char-limit',
    name: 'textareaCharLimit',
    label: 'Short Description',
    placeholder: 'Write a brief description',
    helperText: 'Keep it concise, maximum 100 characters',
    maxLength: 100,
    defaultValue:
      'This is a short description that demonstrates the character counting feature of the TextAreaField component.',
    rows: 3,
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'textarea-required',
    name: 'textareaRequired',
    label: 'Required Feedback',
    placeholder: 'Enter your feedback',
    validation: {
      required: true,
    },
    helperText: 'Feedback is required',
    rows: 4,
  },
};

// With custom validation
export const WithCustomValidation: Story = {
  args: {
    id: 'textarea-validation',
    name: 'textareaValidation',
    label: 'Professional Statement',
    placeholder: 'Enter your professional statement',
    helperText: 'Must not contain the word "hate"',
    validateTextArea: (value) => {
      if (value.toLowerCase().includes('hate')) {
        return 'Please use professional language';
      }
      return true;
    },
    defaultValue: 'I hate working with legacy code',
    rows: 4,
  },
};

// With error
export const WithError: Story = {
  args: {
    id: 'textarea-error',
    name: 'textareaError',
    label: 'Feedback with Error',
    placeholder: 'Enter your feedback',
    showError: 'This feedback contains inappropriate content',
    rows: 4,
  },
};

// Half width
export const HalfWidth: Story = {
  args: {
    id: 'textarea-half',
    name: 'textareaHalf',
    label: 'Notes',
    placeholder: 'Enter your notes',
    width: 'half',
    rows: 4,
  },
};

// Large textarea
export const LargeTextArea: Story = {
  args: {
    id: 'textarea-large',
    name: 'textareaLarge',
    label: 'Detailed Description',
    placeholder: 'Enter a detailed description',
    rows: 8,
    helperText: 'Use this space to provide as much detail as possible',
  },
};
