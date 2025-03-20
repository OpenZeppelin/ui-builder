import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';

import { getContractAdapter } from '@/adapters';
import type { ChainType } from '@/core/types/ContractSchema';
import { cn } from '@/core/utils/utils';

import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

export interface AddressInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Chain type to determine address format validation (default: "evm")
   */
  chainType?: ChainType;
  /**
   * Additional className for the wrapper element
   */
  wrapperClassName?: string;
  /**
   * Label text for the input
   */
  label?: string;
}

/**
 * A specialized input component for blockchain addresses with chain-specific validation
 * and formatting. Includes address format validation, copy button, and visual feedback.
 */
export function AddressInput({
  className,
  wrapperClassName,
  chainType = 'evm',
  onChange,
  value,
  placeholder = 'Enter blockchain address',
  id,
  label,
  ...props
}: AddressInputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Handle validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Only validate if there's a value
    if (newValue.trim()) {
      const adapter = getContractAdapter(chainType);
      const valid = adapter.isValidAddress(newValue);
      setIsValid(valid);
    } else {
      setIsValid(null);
    }

    if (onChange) {
      onChange(e);
    }
  };

  // Copy address to clipboard
  const copyToClipboard = () => {
    if (value && typeof value === 'string') {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy address to clipboard:', err);
        });
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', wrapperClassName)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type="text"
          className={cn(
            'pr-10',
            isValid === true && 'border-green-500 focus-visible:ring-green-500',
            isValid === false && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          aria-invalid={isValid === false ? 'true' : undefined}
          {...props}
        />

        {value && typeof value === 'string' && value.trim() !== '' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-full px-3 py-0"
            onClick={copyToClipboard}
            tabIndex={-1}
            aria-label="Copy address to clipboard"
          >
            {isCopied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="text-muted-foreground h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {isValid === false && (
        <p className="text-sm text-red-500">Invalid blockchain address format</p>
      )}
    </div>
  );
}
