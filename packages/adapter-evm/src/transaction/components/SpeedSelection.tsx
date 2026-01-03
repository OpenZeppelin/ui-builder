import React from 'react';

import { Speed } from '@openzeppelin/relayer-sdk';
import { RadioGroup, RadioGroupItem } from '@openzeppelin/ui-components';

interface SpeedSelectionProps {
  selectedSpeed: Speed | undefined;
  onSpeedChange: (speed: Speed) => void;
}

const speedOptions = [
  {
    value: Speed.FASTEST,
    label: 'Fastest',
    description: 'Maximum priority, highest gas prices',
  },
  {
    value: Speed.FAST,
    label: 'Fast',
    description: 'High priority, recommended for most transactions',
    recommended: true,
  },
  {
    value: Speed.AVERAGE,
    label: 'Average',
    description: 'Standard priority, balanced cost',
  },
  {
    value: Speed.SAFE_LOW,
    label: 'Safe Low',
    description: 'Lower priority, minimal gas cost',
  },
];

export const SpeedSelection: React.FC<SpeedSelectionProps> = ({ selectedSpeed, onSpeedChange }) => {
  return (
    <RadioGroup
      value={selectedSpeed || Speed.FAST}
      onValueChange={(value) => onSpeedChange(value as Speed)}
    >
      <div className="space-y-3">
        {speedOptions.map((option) => (
          <label
            key={option.value}
            htmlFor={`speed-${option.value}`}
            className={`relative block rounded-lg border p-4 cursor-pointer transition-colors ${
              selectedSpeed === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {option.recommended && (
              <span className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                Recommended
              </span>
            )}
            <div className="flex items-start space-x-3">
              <RadioGroupItem
                value={option.value}
                id={`speed-${option.value}`}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </RadioGroup>
  );
};
