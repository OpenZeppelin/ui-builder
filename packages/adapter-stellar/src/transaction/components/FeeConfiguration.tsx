import React from 'react';
import { Control } from 'react-hook-form';

import { BooleanField, NumberField } from '@openzeppelin/ui-components';

import type { StellarRelayerFormData } from './useStellarRelayerOptions';

interface FeeConfigurationProps {
  control: Control<StellarRelayerFormData>;
  showBasicFeeOnly: boolean;
}

export const FeeConfiguration: React.FC<FeeConfigurationProps> = ({
  control,
  showBasicFeeOnly,
}) => {
  return (
    <div className="space-y-4">
      <NumberField
        id="maxFee"
        label="Maximum Fee (stroops)"
        name="transactionOptions.maxFee"
        control={control}
        placeholder="e.g., 1000000 (0.1 XLM)"
        helperText="Maximum fee you're willing to pay in stroops (1 XLM = 10,000,000 stroops). Leave empty to use network defaults."
        min={0}
        step={1}
      />

      {!showBasicFeeOnly && (
        <BooleanField
          id="feeBump"
          label="Enable Fee Bump"
          name="transactionOptions.feeBump"
          control={control}
          helperText="Automatically increase fee if transaction gets stuck in the network."
        />
      )}
    </div>
  );
};
