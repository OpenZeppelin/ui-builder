import React from 'react';
import { Control, Controller } from 'react-hook-form';

import { Button, DateTimeField } from '@openzeppelin/ui-components';

import type { StellarRelayerFormData } from './useStellarRelayerOptions';

interface TransactionTimingProps {
  control: Control<StellarRelayerFormData>;
}

export const TransactionTiming: React.FC<TransactionTimingProps> = ({ control }) => {
  // Helper function to generate a datetime-local value for 1 hour from now
  const getOneHourFromNow = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    return now.toISOString().slice(0, 16);
  };

  // Helper function to generate a datetime-local value for 24 hours from now
  const getTwentyFourHoursFromNow = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      <DateTimeField
        id="validUntil"
        label="Transaction Expiration"
        name="transactionOptions.validUntil"
        control={control}
        placeholder="YYYY-MM-DDTHH:mm"
        helperText="Set when this transaction should expire. Leave empty for no expiration limit."
      />
      <div className="flex gap-2 pt-1">
        <Controller
          name="transactionOptions.validUntil"
          control={control}
          render={({ field }) => (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange(new Date(getOneHourFromNow()).toISOString())}
                className="text-xs"
              >
                +1 Hour
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange(new Date(getTwentyFourHoursFromNow()).toISOString())}
                className="text-xs"
              >
                +24 Hours
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange('')}
                className="text-xs"
              >
                Clear
              </Button>
            </>
          )}
        />
      </div>
    </div>
  );
};
