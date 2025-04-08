import React from 'react';

import { FieldType } from '@openzeppelin/transaction-form-renderer';

import { AlertTriangle } from 'lucide-react';

interface TypeConversionWarningProps {
  selectedType: FieldType;
  originalParameterType: string;
  recommendedType: FieldType;
}

/**
 * Component to display warnings when a field type is different from the recommended type
 * for a specific blockchain parameter type
 */
export function TypeConversionWarning({
  selectedType,
  originalParameterType,
  recommendedType,
}: TypeConversionWarningProps) {
  // Only show warning if selected type differs from recommended
  if (selectedType === recommendedType) {
    return null;
  }

  // Generate appropriate warning message based on the parameter and field types
  const getMessage = () => {
    if (originalParameterType?.includes('address') && selectedType !== 'address') {
      return 'Converting from an address field may lose blockchain address validation.';
    }

    if (
      (originalParameterType?.includes('uint') || originalParameterType?.includes('int')) &&
      !['number', 'amount'].includes(selectedType)
    ) {
      return 'Converting from a numeric type may cause data validation issues during form submission.';
    }

    if (originalParameterType === 'bool' && selectedType !== 'checkbox') {
      return 'Converting from a boolean type may require additional data transformation.';
    }

    return 'This field type conversion may affect data validation or transformation during form submission.';
  };

  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
        <div>
          <p className="font-medium text-amber-800">Type Conversion Warning</p>
          <p className="mt-1 text-sm text-amber-700">{getMessage()}</p>
        </div>
      </div>
    </div>
  );
}
