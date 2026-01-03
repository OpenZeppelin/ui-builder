import React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@openzeppelin/ui-components';

import { AdvancedInfo } from './AdvancedInfo';
import { FeeConfiguration } from './FeeConfiguration';
import { TransactionTiming } from './TransactionTiming';
import { useStellarRelayerOptions } from './useStellarRelayerOptions';

/**
 * Stellar-specific relayer transaction options component.
 *
 * Provides configuration for Stellar transaction parameters:
 * - Basic: Simple max fee configuration with reasonable defaults
 * - Advanced: Full control over maxFee, validUntil, and feeBump options
 *
 * Stellar transactions have different parameters compared to EVM:
 * - maxFee: Maximum fee willing to pay (in stroops)
 * - validUntil: Transaction expiration time
 * - feeBump: Enable fee bump for stuck transactions
 */
export const StellarRelayerOptions: React.FC<{
  options: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}> = ({ options, onChange }) => {
  const [showAdvancedInfo, setShowAdvancedInfo] = React.useState(false);

  const { control, configMode, handleModeChange } = useStellarRelayerOptions({
    options,
    onChange,
  });

  return (
    <div className="space-y-4">
      <AdvancedInfo
        showAdvancedInfo={showAdvancedInfo}
        onToggle={() => setShowAdvancedInfo(!showAdvancedInfo)}
      />

      <Tabs value={configMode} onValueChange={handleModeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <FeeConfiguration control={control} showBasicFeeOnly={true} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-6">
            <FeeConfiguration control={control} showBasicFeeOnly={false} />

            <TransactionTiming control={control} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
