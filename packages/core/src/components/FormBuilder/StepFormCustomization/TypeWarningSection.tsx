import type { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import { FieldType } from '@openzeppelin/transaction-form-types/forms';

import { TypeConversionWarning } from './TypeConversionWarning';

interface TypeWarningSectionProps {
  /**
   * The currently selected field type
   */
  selectedType: FieldType;

  /**
   * The contract adapter for the selected blockchain
   */
  adapter?: ContractAdapter;

  /**
   * The original blockchain parameter type
   */
  originalParameterType?: string;
}

/**
 * Component that conditionally displays a type conversion warning
 * when a non-recommended field type is selected
 */
export function TypeWarningSection({
  selectedType,
  adapter,
  originalParameterType,
}: TypeWarningSectionProps) {
  // Only show warning if adapter and original parameter type are available
  if (!adapter || !originalParameterType) {
    return null;
  }

  // Get the recommended field type from the adapter
  const recommendedType = adapter.getCompatibleFieldTypes(originalParameterType)[0];

  return (
    <TypeConversionWarning
      selectedType={selectedType}
      recommendedType={recommendedType}
      originalParameterType={originalParameterType}
    />
  );
}
