import { FieldType } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

import { TypeConversionWarning } from './TypeConversionWarning';

interface TypeWarningSectionProps {
  /**
   * The currently selected field type
   */
  selectedType: FieldType;

  /**
   * The runtime for the selected blockchain
   */
  runtime?: BuilderRuntime;

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
  runtime,
  originalParameterType,
}: TypeWarningSectionProps) {
  // Skip warning for runtime secret fields (not blockchain parameters)
  if (originalParameterType === 'runtimeSecret' || selectedType === 'runtimeSecret') {
    return null;
  }

  // Only show warning if runtime and original parameter type are available
  if (!runtime || !originalParameterType) {
    return null;
  }

  // Get the recommended field type from the runtime
  const recommendedType = runtime.typeMapping.getCompatibleFieldTypes(originalParameterType)[0];

  return (
    <TypeConversionWarning
      selectedType={selectedType}
      recommendedType={recommendedType}
      originalParameterType={originalParameterType}
    />
  );
}
