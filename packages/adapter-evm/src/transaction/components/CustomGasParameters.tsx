import { Circle } from 'lucide-react';
import React from 'react';
import { Control } from 'react-hook-form';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  BooleanField,
  NumberField,
} from '@openzeppelin/ui-components';
import { cn } from '@openzeppelin/ui-utils';

import { EvmRelayerFormData } from './useEvmRelayerOptions';

interface CustomGasParametersProps {
  control: Control<EvmRelayerFormData>;
  configMode: string;
  gasType: string;
  showGasLimit: boolean;
  onGasTypeSwitch: (type: string) => void;
}

export const CustomGasParameters: React.FC<CustomGasParametersProps> = ({
  control,
  configMode,
  gasType,
  showGasLimit,
  onGasTypeSwitch,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Manually configure gas parameters. You must provide either <strong>Legacy</strong>{' '}
          (gasPrice) or <strong>EIP-1559</strong> (maxFeePerGas + maxPriorityFeePerGas) values.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Select Gas Pricing Method
        </p>

        <Accordion
          type="single"
          collapsible
          value={gasType}
          onValueChange={(value) => value && onGasTypeSwitch(value)}
          className="w-full space-y-3"
        >
          <AccordionItem
            value="eip1559"
            className={cn(
              'rounded-lg border shadow-sm overflow-hidden transition-all',
              gasType === 'eip1559'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/50'
            )}
          >
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Circle
                      className={`h-4 w-4 ${gasType === 'eip1559' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    {gasType === 'eip1559' && (
                      <Circle className="h-4 w-4 absolute inset-0 text-primary fill-primary scale-50" />
                    )}
                  </div>
                  <span>EIP-1559</span>
                </div>
                {gasType === 'eip1559' && (
                  <span className="text-xs text-primary font-medium mr-2">Selected</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 pt-4 grid gap-4 border-t bg-background/50">
                <NumberField
                  id="maxFeePerGas"
                  label="Max Fee Per Gas"
                  name="transactionOptions.maxFeePerGas"
                  control={control}
                  placeholder="30"
                  helperText="Maximum total fee per gas unit you're willing to pay (in gwei)"
                  step={0.1}
                  min={0}
                  validation={{ required: configMode === 'custom' && gasType === 'eip1559' }}
                />

                <NumberField
                  id="maxPriorityFeePerGas"
                  label="Max Priority Fee Per Gas"
                  name="transactionOptions.maxPriorityFeePerGas"
                  control={control}
                  placeholder="2"
                  helperText="Priority fee (tip) to incentivize miners (in gwei)"
                  step={0.1}
                  min={0}
                  validation={{ required: configMode === 'custom' && gasType === 'eip1559' }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="legacy"
            className={cn(
              'rounded-lg border shadow-sm overflow-hidden transition-all',
              gasType === 'legacy'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/50'
            )}
          >
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Circle
                      className={`h-4 w-4 ${gasType === 'legacy' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    {gasType === 'legacy' && (
                      <Circle className="h-4 w-4 absolute inset-0 text-primary fill-primary scale-50" />
                    )}
                  </div>
                  <span>Legacy Gas Price</span>
                </div>
                {gasType === 'legacy' && (
                  <span className="text-xs text-primary font-medium mr-2">Selected</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 pt-4 border-t bg-background/50">
                <NumberField
                  id="gasPrice"
                  label="Gas Price"
                  name="transactionOptions.gasPrice"
                  control={control}
                  placeholder="20"
                  helperText="Fixed gas price for legacy transactions (in gwei)"
                  step={0.1}
                  min={0}
                  validation={{ required: configMode === 'custom' && gasType === 'legacy' }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="space-y-2">
        <BooleanField
          id="showGasLimit"
          label="Override gas limit"
          name="transactionOptions.showGasLimit"
          control={control}
          helperText="Enable manual gas limit configuration"
        />

        {showGasLimit && (
          <div className="pl-6">
            <NumberField
              id="gasLimit"
              label="Gas Limit"
              name="transactionOptions.gasLimit"
              control={control}
              placeholder="Auto-detected by relayer"
              helperText="Leave empty to let the relayer estimate. Only override if you need a specific limit."
              step={1000}
              min={21000}
            />
          </div>
        )}
      </div>
    </div>
  );
};
