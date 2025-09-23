import { debounce } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';
import { TextAreaField, TextField } from '@openzeppelin/contracts-ui-builder-ui';

interface GeneralSettingsProps {
  /**
   * Current form title (may be undefined for new forms)
   */
  title: string | undefined;
  /**
   * Current form description (may be undefined for new forms)
   */
  description: string | undefined;
  /**
   * Callback fired when the title is updated
   */
  onUpdateTitle: (title: string) => void;
  /**
   * Callback fired when the description is updated
   */
  onUpdateDescription: (description: string) => void;
  /**
   * Details of the selected contract function for generating defaults
   */
  selectedFunctionDetails: ContractFunction;
}

/**
 * Component for editing general form settings like title and description.
 *
 * Features:
 * - Auto-generates default title and description from function details
 * - Debounced updates to reduce parent re-renders during typing
 * - Form state synchronization with parent props
 * - Optimized re-rendering with memoization
 *
 * @param props - Component props
 * @param props.title - Current form title
 * @param props.description - Current form description
 * @param props.onUpdateTitle - Callback to update title in parent state
 * @param props.onUpdateDescription - Callback to update description in parent state
 * @param props.selectedFunctionDetails - Function details for generating defaults
 */
export const GeneralSettings = React.memo(function GeneralSettings({
  title,
  description,
  onUpdateTitle,
  onUpdateDescription,
  selectedFunctionDetails,
}: GeneralSettingsProps) {
  // Memoize the default values to prevent unnecessary re-computations
  const defaultValues = useMemo(() => {
    const defaultTitle = `${selectedFunctionDetails.displayName} Form`;
    const defaultDescription =
      selectedFunctionDetails.description ||
      `Form for interacting with the ${selectedFunctionDetails.displayName} function.`;

    return {
      defaultTitle,
      defaultDescription,
    };
  }, [selectedFunctionDetails.displayName, selectedFunctionDetails.description]);

  // Set up React Hook Form with memoized default values
  const formDefaultValues = useMemo(
    () => ({
      formTitle: title !== undefined ? title : defaultValues.defaultTitle,
      formDescription: description !== undefined ? description : defaultValues.defaultDescription,
    }),
    [title, description, defaultValues.defaultTitle, defaultValues.defaultDescription]
  );

  const { control, watch, reset } = useForm({
    defaultValues: formDefaultValues,
  });

  const debouncedUpdateTitle = useMemo(
    () =>
      debounce((value: string) => {
        // Use microtask for non-blocking updates
        void Promise.resolve().then(() => {
          onUpdateTitle(value);
        });
      }, 500),
    [onUpdateTitle]
  );

  const debouncedUpdateDescription = useMemo(
    () =>
      debounce((value: string) => {
        // Use microtask for non-blocking updates
        void Promise.resolve().then(() => {
          onUpdateDescription(value);
        });
      }, 500),
    [onUpdateDescription]
  );

  // Reset form when props change to keep form in sync with parent state
  useEffect(() => {
    reset(formDefaultValues);
  }, [formDefaultValues, reset]);

  // Watch for changes and update the parent with debouncing
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'formTitle' && value.formTitle !== undefined) {
        debouncedUpdateTitle(value.formTitle as string);
      }
      if (name === 'formDescription' && value.formDescription !== undefined) {
        debouncedUpdateDescription(value.formDescription as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedUpdateTitle, debouncedUpdateDescription]);

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateTitle.cancel();
      debouncedUpdateDescription.cancel();
    };
  }, [debouncedUpdateTitle, debouncedUpdateDescription]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-muted-foreground text-sm">
          Configure the basic information for your form, including title and description.
        </p>
      </div>

      <div className="space-y-4">
        <TextField
          id="form-title"
          name="formTitle"
          label="Form Title"
          control={control}
          placeholder="Enter a title for your form"
          helperText="This will be displayed at the top of your form."
        />

        <TextAreaField
          id="form-description"
          name="formDescription"
          label="Form Description"
          control={control}
          placeholder="Enter a description for your form"
          helperText="This optional description helps users understand what the form is for."
        />
      </div>
    </div>
  );
});
