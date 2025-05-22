import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

import React from 'react';

import type { TxStatus } from '@openzeppelin/transaction-form-types';
import { Alert, AlertDescription, AlertTitle, Button } from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

import { TransactionHashDisplay } from './TransactionHashDisplay';

interface TransactionStatusDisplayProps {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  explorerUrl?: string | null; // URL for the transaction hash link
  onClose?: () => void; // Callback to close/reset the display
  className?: string; // Allow custom styling
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
    return <span className="break-words">{errorMsg}</span>;
  }

  // If we found a hash, format it for better display
  const parts = errorMsg.split(hashRegex);

  return (
    <span className="break-words">
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
}: TransactionStatusDisplayProps): React.ReactElement | null {
  if (status === 'idle') {
    return null;
  }

  let variant: 'default' | 'destructive' | 'success' = 'default';
  let title = '';
  let icon: React.ReactNode = null;
  let content: React.ReactNode = null;

  if (status === 'pendingSignature') {
    title = 'Pending Signature';
    icon = <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    content = (
      <div>
        <p>Please check your connected wallet to sign the transaction.</p>
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
    variant = 'default';
  } else if (status === 'pendingConfirmation') {
    title = 'Processing Transaction';
    icon = <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    content = (
      <div>
        <p>Waiting for the transaction to be confirmed on the blockchain...</p>
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
    variant = 'default';
  } else if (status === 'success') {
    title = 'Transaction Successful';
    icon = <CheckCircle className="h-5 w-5 text-green-600" />;
    content = (
      <div>
        <p>Your transaction has been confirmed.</p>
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
    variant = 'success';
  } else if (status === 'error') {
    title = 'Transaction Failed';
    icon = <AlertCircle className="h-5 w-5 text-destructive" />;
    content = (
      <div>
        {formatErrorWithHash(error || 'An unknown error occurred.')}
        {txHash && <TransactionHashDisplay txHash={txHash} explorerUrl={explorerUrl || null} />}
      </div>
    );
    variant = 'destructive';
  }

  return (
    <Alert variant={variant} className={cn('relative py-4 px-5 overflow-hidden', className)}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="mb-1 text-base font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm overflow-hidden">{content}</AlertDescription>
        </div>
        {onClose && (status === 'success' || status === 'error') && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 -mr-1 -mt-1 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80"
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
