import { Check, Copy, ExternalLink } from 'lucide-react';
import * as React from 'react';

import { cn, truncateMiddle } from '@openzeppelin/ui-builder-utils';

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
   * Whether to show the copy button only on hover
   * @default false
   */
  showCopyButtonOnHover?: boolean;

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
  showCopyButtonOnHover = false,
  explorerUrl,
  className,
  ...props
}: AddressDisplayProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = React.useRef<number | null>(null);

  const displayAddress = truncate ? truncateMiddle(address, startChars, endChars) : address;

  const handleCopy = (e: React.MouseEvent): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 2000);
  };

  React.useEffect(() => {
    return (): void => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const addressContent = (
    <>
      <span className={cn('truncate', truncate ? '' : 'break-all')}>{displayAddress}</span>

      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'shrink-0 text-slate-500',
            !copied && 'hover:text-slate-700',
            showCopyButtonOnHover
              ? // Do not reserve space until hover/focus: width and margin grow on interaction
                'ml-0 w-0 overflow-hidden opacity-0 transition-all duration-150 group-hover:ml-1.5 group-hover:w-3.5 group-hover:opacity-100 focus:ml-1.5 focus:w-3.5 focus:opacity-100'
              : // Default: always visible with standard spacing
                'ml-1.5 transition-colors'
          )}
          aria-label={copied ? 'Copied' : 'Copy address'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1.5 shrink-0 text-slate-500 transition-colors hover:text-slate-700"
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
        'group inline-flex max-w-full items-center rounded-md bg-slate-100 px-2 py-1',
        'text-xs font-mono text-slate-700',
        className
      )}
      {...props}
    >
      {addressContent}
    </div>
  );
}
