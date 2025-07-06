import { CheckCircle } from 'lucide-react';

import React from 'react';
import { Control } from 'react-hook-form';

import type { RelayerDetails, RelayerDetailsRich } from '@openzeppelin/transaction-form-types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RelayerDetailsCard,
  SelectField,
} from '@openzeppelin/transaction-form-ui';
import { truncateMiddle } from '@openzeppelin/transaction-form-utils';

import type { ExecutionMethodFormData } from '../../../types';

interface RelayerSelectionCardProps {
  isActive: boolean;
  isComplete: boolean;
  control: Control<ExecutionMethodFormData>;
  fetchedRelayers: RelayerDetails[];
  selectedRelayerId?: string;
  enhancedDetails: RelayerDetailsRich | null;
  loadingEnhancedDetails: boolean;
  isLoading: boolean;
  onEdit: () => void;
}

export function RelayerSelectionCard({
  isActive,
  isComplete,
  control,
  fetchedRelayers,
  selectedRelayerId,
  enhancedDetails,
  loadingEnhancedDetails,
  isLoading,
  onEdit,
}: RelayerSelectionCardProps): React.ReactElement {
  const relayerOptions = fetchedRelayers.map((r) => ({
    value: r.relayerId,
    label: `${r.name} (${truncateMiddle(r.address, 6, 4)})`,
    disabled: isLoading,
  }));

  return (
    <Card className={!isActive && isComplete ? 'opacity-60' : ''}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`rounded-md p-0.5 ${
                isComplete ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <span className="block w-5 h-5 text-center text-xs font-medium leading-5">2</span>
              )}
            </div>
            <CardTitle className="text-base">Select Relayer</CardTitle>
          </div>
          {isComplete && !isActive && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Change
            </Button>
          )}
        </div>
      </CardHeader>

      {(isActive || !isComplete) && (
        <CardContent className="space-y-4">
          <SelectField
            id="selected-relayer"
            label="Available Relayers"
            name="selectedRelayer"
            control={control}
            options={relayerOptions}
            validation={{ required: true }}
            placeholder="Choose a relayer"
          />

          {selectedRelayerId && (
            <RelayerDetailsCard
              details={fetchedRelayers.find((r) => r.relayerId === selectedRelayerId)!}
              enhancedDetails={enhancedDetails}
              loading={loadingEnhancedDetails}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
