import React from 'react';
import { Control, Controller } from 'react-hook-form';

import { Button, Input, Label } from '@openzeppelin/contracts-ui-builder-ui';

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
      <div className="space-y-2">
        <Label htmlFor="validUntil" className="text-sm font-medium">
          Transaction Expiration
        </Label>
        <Controller
          name="transactionOptions.validUntil"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="validUntil"
              type="datetime-local"
              className="w-full"
              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  // Convert datetime-local to ISO 8601 string
                  const date = new Date(e.target.value);
                  field.onChange(date.toISOString());
                } else {
                  field.onChange('');
                }
              }}
            />
          )}
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
                  onClick={() =>
                    field.onChange(new Date(getTwentyFourHoursFromNow()).toISOString())
                  }
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
        <p className="text-xs text-muted-foreground">
          Set when this transaction should expire. Leave empty for no expiration limit.
        </p>
      </div>
    </div>
  );
};
