import { Info } from 'lucide-react';
import React from 'react';

import { Button } from '@openzeppelin/ui-components';

interface AdvancedInfoProps {
  showAdvancedInfo: boolean;
  onToggle: () => void;
}

export const AdvancedInfo: React.FC<AdvancedInfoProps> = ({ showAdvancedInfo, onToggle }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-base font-medium">Gas Pricing Strategy</label>
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs" type="button">
          <Info className="h-3 w-3 mr-1" />
          API Requirements
        </Button>
      </div>

      {showAdvancedInfo && (
        <div className="mt-3 rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The OpenZeppelin Relayer API requires exactly one pricing strategy: either a{' '}
            <strong>Speed</strong> enum value (FASTEST, FAST, AVERAGE, SAFE_LOW) or{' '}
            <strong>custom gas parameters</strong> (gasPrice for legacy, or maxFeePerGas +
            maxPriorityFeePerGas for EIP-1559).
          </p>
        </div>
      )}
    </div>
  );
};
