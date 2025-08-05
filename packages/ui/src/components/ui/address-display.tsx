import { Copy, ExternalLink } from 'lucide-react';
import * as React from 'react';

import { cn, truncateMiddle } from '@openzeppelin/contracts-ui-builder-utils';

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
   * Optional explorer URL to make the address clickable
   */
  explorerUrl?: string;

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
  explorerUrl,
  className,
  ...props
}: AddressDisplayProps): React.ReactElement {
  const displayAddress = truncate ? truncateMiddle(address, startChars, endChars) : address;

  const handleCopy = (): void => {
    navigator.clipboard.writeText(address);
  };

  const addressContent = (
    <>
      <span className={cn('truncate', truncate ? '' : 'break-all')}>{displayAddress}</span>

      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="ml-1.5 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          aria-label="Copy address"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1.5 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          aria-label="View in explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </>
  );

  return (
    <div
      className={cn(
        'inline-flex items-center bg-slate-100 rounded-md px-2 py-1 max-w-full',
        'text-slate-700 text-xs font-mono',
        className
      )}
      {...props}
    >
      {addressContent}
    </div>
  );
}
