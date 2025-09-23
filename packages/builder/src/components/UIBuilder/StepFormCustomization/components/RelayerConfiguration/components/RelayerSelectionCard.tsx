import { CheckCircle } from 'lucide-react';
import React from 'react';
import { Control } from 'react-hook-form';

import type {
  ContractAdapter,
  RelayerDetails,
  RelayerDetailsRich,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RelayerDetailsCard,
  SelectField,
} from '@openzeppelin/contracts-ui-builder-ui';
import { truncateMiddle } from '@openzeppelin/contracts-ui-builder-utils';

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
  adapter?: ContractAdapter | null;
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
  adapter,
}: RelayerSelectionCardProps): React.ReactElement {
  const relayerOptions = fetchedRelayers.map((r) => ({
    value: r.relayerId,
    label: `${r.name} (${truncateMiddle(r.address, 6, 4)})`,
    disabled: isLoading,
  }));

  return (
    <Card className={!isActive && isComplete ? 'opacity-60' : ''}>
      <CardHeader className="pb-1 pt-2 px-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-1.5">
            {isComplete && (
              <div className="rounded-md p-0.5 bg-green-100 text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
            )}
            <CardTitle className="text-base">Select Relayer</CardTitle>
          </div>
          {isComplete && !isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="self-center sm:self-auto mt-1 sm:mt-0"
            >
              Change
            </Button>
          )}
        </div>
      </CardHeader>

      {(isActive || !isComplete) && (
        <CardContent className="space-y-3 pt-0">
          <div className="w-full">
            <SelectField
              id="selected-relayer"
              label="Available Relayers"
              name="selectedRelayer"
              control={control}
              options={relayerOptions}
              validation={{ required: true }}
              placeholder="Choose a relayer"
            />
          </div>

          {selectedRelayerId && (
            <div className="w-full">
              <RelayerDetailsCard
                details={fetchedRelayers.find((r) => r.relayerId === selectedRelayerId)!}
                enhancedDetails={enhancedDetails}
                loading={loadingEnhancedDetails}
                className="w-full"
                labels={adapter?.getUiLabels?.()}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
