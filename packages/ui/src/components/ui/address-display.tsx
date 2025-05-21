import { Copy } from 'lucide-react';

import * as React from 'react';

import { cn, truncateMiddle } from '@openzeppelin/transaction-form-utils';

interface AddressDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The blockchain address to display
   */
  address: string;

  /**
   * Whether to truncate the address in the middle
   * @default true
   */
  truncate?: boolean;

  /**
   * Number of characters to show at the beginning when truncating
   * @default 6
   */
  startChars?: number;

  /**
   * Number of characters to show at the end when truncating
   * @default 4
   */
  endChars?: number;

  /**
   * Whether to show a copy button
   * @default false
   */
  showCopyButton?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function AddressDisplay({
  address,
  truncate = true,
  startChars = 6,
  endChars = 4,
  showCopyButton = false,
  className,
  ...props
}: AddressDisplayProps): React.ReactElement {
  const displayAddress = truncate ? truncateMiddle(address, startChars, endChars) : address;

  const handleCopy = (): void => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center bg-slate-100 rounded-md px-2 py-1',
        'text-slate-700 text-xs font-mono',
        className
      )}
      {...props}
    >
      <span>{displayAddress}</span>

      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="ml-1.5 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Copy address"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
