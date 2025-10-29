import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import React from 'react';

import type { TxStatus } from '@openzeppelin/ui-builder-types';
import { Alert, AlertDescription, AlertTitle, Button } from '@openzeppelin/ui-builder-ui';
import { cn } from '@openzeppelin/ui-builder-utils';

import { TransactionHashDisplay } from './TransactionHashDisplay';

interface TransactionStatusDisplayProps {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  explorerUrl?: string | null; // URL for the transaction hash link
  onClose?: () => void; // Callback to close/reset the display
  className?: string; // Allow custom styling
  // Optional adapter-provided copy
  customTitle?: string;
  customMessage?: string;
}

/**
 * Helper function to format error messages that contain transaction hashes
 * This adds proper word breaking for transaction hashes while maintaining readability
 */
function formatErrorWithHash(errorMsg: string): React.ReactNode {
  if (!errorMsg) return 'An unknown error occurred.';

  // Check if the error message contains a transaction hash (0x followed by hex characters)
  const hashRegex = /(0x[a-fA-F0-9]{40,})/g;

  if (!hashRegex.test(errorMsg)) {
    return <span className="wrap-break-word">{errorMsg}</span>;
  }

  // If we found a hash, format it for better display
  const parts = errorMsg.split(hashRegex);

  return (
    <span className="wrap-break-word">
      {parts.map((part, i) => {
        if (part.match(/^0x[a-fA-F0-9]{40,}$/)) {
          // This part is a hash, format it specially
          return (
            <code key={i} className="font-mono px-1 py-0.5 bg-gray-100 rounded text-xs break-all">
              {part}
            </code>
          );
        }
        return part;
      })}
    </span>
  );
}

export function TransactionStatusDisplay({
  status,
  txHash,
  error,
  explorerUrl,
  onClose,
  className,
  customTitle,
  customMessage,
}: TransactionStatusDisplayProps): React.ReactElement | null {
  if (status === 'idle') {
    return null;
  }

  let variant: 'default' | 'destructive' | 'success' = 'default';
  let defaultTitle = '';
  let defaultMessage: string | null = null;
  let icon: React.ReactNode = null;

  if (status === 'pendingSignature') {
    defaultTitle = 'Pending Signature';
    icon = <Loader2 className="size-5 animate-spin text-primary" />;
    // Default copy covers both signature and auto-confirmation in one message (chain-agnostic).
    defaultMessage =
      'Please check your wallet to sign. After signing, your transaction will be submitted and confirmed automatically.';
    variant = 'default';
  } else if (status === 'pendingConfirmation') {
    defaultTitle = 'Processing Transaction';
    icon = <Loader2 className="size-5 animate-spin text-primary" />;
    defaultMessage = 'Waiting for the transaction to be confirmed on the blockchain...';
    variant = 'default';
  } else if (status === 'pendingRelayer') {
    defaultTitle = 'Waiting for Relayer';
    icon = <Loader2 className="size-5 animate-spin text-primary" />;
    defaultMessage = 'The transaction is pending with the relayer and will be submitted shortly.';
    variant = 'default';
  } else if (status === 'success') {
    defaultTitle = 'Transaction Successful';
    icon = <CheckCircle className="size-5 text-green-600" />;
    defaultMessage = 'Your transaction has been confirmed.';
    variant = 'success';
  } else if (status === 'error') {
    defaultTitle = 'Transaction Failed';
    icon = <AlertCircle className="size-5 text-destructive" />;
    variant = 'destructive';
  }

  const title = customTitle || defaultTitle;

  let content: React.ReactNode = null;
  if (status === 'error') {
    content = (
      <div>
        {error ? (
          formatErrorWithHash(error)
        ) : customMessage ? (
          <span className="wrap-break-word">{customMessage}</span>
        ) : (
          <span className="wrap-break-word">An unknown error occurred.</span>
        )}
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
  } else {
    const messageText = customMessage || defaultMessage || '';
    content = (
      <div>
        <p>{messageText}</p>
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
  }

  return (
    <Alert variant={variant} className={cn('relative py-4 px-5 overflow-hidden', className)}>
      <div className="flex items-start">
        <div className="shrink-0 mr-3 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="mb-1 text-base font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm overflow-hidden">{content}</AlertDescription>
        </div>
        {onClose && (status === 'success' || status === 'error') && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mr-1 -mt-1 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80"
            onClick={onClose}
            aria-label="Reset Status"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
