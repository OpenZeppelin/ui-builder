import React from 'react';

import { RadioField } from '@openzeppelin/ui-components';

import { BlockchainAddressFieldWithRichPreview } from '@/components/fields/BlockchainAddressFieldWithRichPreview';

import type { EoaConfigurationProps } from '../types';

const eoaSubOptions = [
  { value: 'any', label: 'Allow any EOA to execute' },
  { value: 'specific', label: 'Require a specific EOA to execute' },
];

export function EoaConfiguration({
  control,
  runtime,
  watchedEoaOption,
}: EoaConfigurationProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-medium mb-2">EOA Configuration</h4>

      {/* EOA Sub-Options RadioField */}
      <div className="pt-2">
        <RadioField
          id="eoa-sub-options"
          label="EOA Restriction"
          name="eoaOption"
          control={control}
          options={eoaSubOptions}
        />
      </div>

      {/* Specific EOA Address Input - Rendered conditionally */}
      {watchedEoaOption === 'specific' && (
        <div className="pt-2">
          <BlockchainAddressFieldWithRichPreview
            id="specific-eoa-address"
            label="Specific EOA Address"
            name="specificEoaAddress"
            control={control}
            addressing={runtime?.addressing}
            networkId={runtime?.networkConfig.id}
            validation={{ required: true }}
            placeholder="Enter the required EOA address (e.g., 0x...)"
          />
        </div>
      )}
    </div>
  );
}

EoaConfiguration.displayName = 'EoaConfiguration';
