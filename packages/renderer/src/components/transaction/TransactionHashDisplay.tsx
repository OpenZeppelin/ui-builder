import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import React from 'react';

interface TransactionHashDisplayProps {
  /**
   * The transaction hash to display
   */
  txHash: string;

  /**
   * Optional URL to view the transaction on a block explorer
   */
  explorerUrl: string | null;
}

/**
 * Renders a transaction hash with proper formatting and optional explorer link.
 * This component ensures transaction hashes are displayed in a consistent way
 * with proper word-breaking for long strings.
 */
export function TransactionHashDisplay({
  txHash,
  explorerUrl,
}: TransactionHashDisplayProps): React.ReactElement {
  return (
    <div className="text-sm mt-2 relative">
      <div className="text-muted-foreground text-xs mb-1">Transaction:</div>

      {/* Transaction hash with monospace font */}
      <div className="mb-2">
        <code className="font-mono text-xs bg-gray-100 px-2 py-1.5 rounded break-all inline-block">
          {txHash}
        </code>
      </div>

      {/* Explorer link with improved clickability */}
      {explorerUrl && (
        <div className="relative z-10 pointer-events-auto">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-primary hover:text-primary/80 hover:underline py-1 px-2 cursor-pointer"
            onClick={() => {
              // Add a debug log to ensure click is working
              console.log('Explorer link clicked', explorerUrl);
              // Don't stop propagation - we want to bubble up
            }}
          >
            <ExternalLinkIcon size={12} className="mr-1 flex-shrink-0" />
            <span>View on explorer</span>
          </a>
        </div>
      )}
    </div>
  );
}
