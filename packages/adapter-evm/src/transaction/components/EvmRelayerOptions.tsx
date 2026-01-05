import React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@openzeppelin/ui-components';

import { AdvancedInfo } from './AdvancedInfo';
import { CustomGasParameters } from './CustomGasParameters';
import { SpeedSelection } from './SpeedSelection';
import { useEvmRelayerOptions } from './useEvmRelayerOptions';

/**
 * EVM-specific relayer transaction options component.
 *
 * Provides configuration for gas pricing strategies:
 * - Speed presets: Use predefined gas pricing levels (OpenZeppelin Relayer API)
 * - Custom: Manual gas parameter configuration for precise control
 *
 * We default to Speed mode with FAST preset to ensure valid API requests.
 * The OpenZeppelin Relayer API requires exactly one pricing strategy to be provided.
 */
export const EvmRelayerOptions: React.FC<{
  options: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}> = ({ options, onChange }) => {
  const [showAdvancedInfo, setShowAdvancedInfo] = React.useState(false);

  const {
    control,
    formValues,
    configMode,
    gasType,
    handleSpeedChange,
    handleModeChange,
    handleGasTypeSwitch,
  } = useEvmRelayerOptions({ options, onChange });

  return (
    <div className="space-y-4">
      <AdvancedInfo
        showAdvancedInfo={showAdvancedInfo}
        onToggle={() => setShowAdvancedInfo(!showAdvancedInfo)}
      />

      <Tabs value={configMode} onValueChange={handleModeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="speed" className="space-y-4">
          <SpeedSelection selectedSpeed={formValues.speed} onSpeedChange={handleSpeedChange} />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <CustomGasParameters
            control={control}
            configMode={configMode}
            gasType={gasType}
            showGasLimit={formValues.showGasLimit || false}
            onGasTypeSwitch={handleGasTypeSwitch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
