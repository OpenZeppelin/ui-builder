import React from 'react';
import { useForm } from 'react-hook-form';

import { BooleanField, TextField } from '@form-renderer/components/fields';

import type { FilterControlsProps } from './types';

export function FilterControls({
  filterValue,
  setFilterValue,
  showReadOnlyFunctions,
  setShowReadOnlyFunctions,
}: FilterControlsProps) {
  // Set up form with React Hook Form
  const { control, watch } = useForm({
    defaultValues: {
      filterValue: filterValue,
      showReadOnly: showReadOnlyFunctions,
    },
  });

  // Watch for changes and update parent state
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'filterValue') {
        setFilterValue(value.filterValue || '');
      } else if (name === 'showReadOnly') {
        setShowReadOnlyFunctions(!!value.showReadOnly);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setFilterValue, setShowReadOnlyFunctions]);

  return (
    <div className="space-y-4">
      <TextField
        id="filter-functions"
        name="filterValue"
        label=""
        placeholder="Filter functions..."
        control={control}
      />

      <BooleanField
        id="show-readonly"
        name="showReadOnly"
        label="Show read-only functions (view/pure)"
        control={control}
      />
    </div>
  );
}
