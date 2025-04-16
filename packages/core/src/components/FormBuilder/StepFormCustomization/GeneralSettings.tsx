import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { TextAreaField, TextField } from '@openzeppelin/transaction-form-renderer';
import type { ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

interface GeneralSettingsProps {
  title: string | undefined;
  description: string | undefined;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  selectedFunctionDetails: ContractFunction;
}

/**
 * Component for editing general form settings like title and description
 */
export function GeneralSettings({
  title,
  description,
  onUpdateTitle,
  onUpdateDescription,
  selectedFunctionDetails,
}: GeneralSettingsProps) {
  // Get the default title and description based on function details
  const defaultTitle = `${selectedFunctionDetails.displayName} Form`;
  const defaultDescription =
    selectedFunctionDetails.description ||
    `Form for interacting with the ${selectedFunctionDetails.displayName} function.`;

  // Set up React Hook Form
  const { control, watch, reset } = useForm({
    defaultValues: {
      formTitle: title !== undefined ? title : defaultTitle,
      formDescription: description !== undefined ? description : defaultDescription,
    },
  });

  // Reset form when props change to keep form in sync with parent state
  useEffect(() => {
    reset({
      formTitle: title !== undefined ? title : defaultTitle,
      formDescription: description !== undefined ? description : defaultDescription,
    });
  }, [title, description, defaultTitle, defaultDescription, reset]);

  // Watch for changes and update the parent
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'formTitle' && value.formTitle !== undefined) {
        onUpdateTitle(value.formTitle as string);
      }
      if (name === 'formDescription' && value.formDescription !== undefined) {
        onUpdateDescription(value.formDescription as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdateTitle, onUpdateDescription]);

  return (
    <div className="space-y-6">
      <h4 className="text-md mb-4 font-medium">Form Settings</h4>

      {/* Form Title Section */}
      <div className="space-y-4">
        <TextField
          id="form-title"
          name="formTitle"
          label="Form Title"
          placeholder="Enter a title for your form"
          helperText="This title will be displayed to users at the top of your form"
          control={control}
          validation={{}}
          width="full"
        />
      </div>

      {/* Form Description Section */}
      <div className="space-y-4">
        <TextAreaField
          id="form-description"
          name="formDescription"
          label="Form Description"
          placeholder="Enter a description for your form"
          helperText="This description will be displayed below the title to help users understand the form's purpose."
          control={control}
          rows={4}
          validation={{}}
          width="full"
        />
      </div>
    </div>
  );
}
