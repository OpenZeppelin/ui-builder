import React from 'react';
import { useForm } from 'react-hook-form';

import { TextField } from '@openzeppelin/transaction-form-ui';

import type { FilterControlsProps } from './types';

export function FilterControls({ filterValue, setFilterValue }: FilterControlsProps) {
  // Set up form with React Hook Form
  const { control, watch } = useForm({
    defaultValues: {
      filterValue: filterValue,
    },
  });

  // Watch for changes and update parent state
  React.useEffect(() => {
    const subscription = watch((value) => {
      setFilterValue(value.filterValue || '');
    });

    return () => subscription.unsubscribe();
  }, [watch, setFilterValue]);

  return (
    <div className="space-y-4">
      <TextField
        id="filter-functions"
        name="filterValue"
        label=""
        placeholder="Filter functions..."
        control={control}
      />
    </div>
  );
}
