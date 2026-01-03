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
        <label className="text-base font-medium">Stellar Transaction Configuration</label>
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs" type="button">
          <Info className="h-3 w-3 mr-1" />
          Stellar Options
        </Button>
      </div>

      {showAdvancedInfo && (
        <div className="mt-3 rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configure Stellar-specific transaction parameters: <strong>maxFee</strong> sets the
            maximum fee in stroops you&apos;re willing to pay, <strong>validUntil</strong> sets
            transaction expiration, and <strong>feeBump</strong> enables automatic fee increases for
            stuck transactions.
          </p>
        </div>
      )}
    </div>
  );
};
