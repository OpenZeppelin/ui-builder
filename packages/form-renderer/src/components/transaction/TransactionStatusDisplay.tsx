import { AlertCircle, CheckCircle, Info, Loader2, X } from 'lucide-react';

import React from 'react';

import type { TxStatus } from '@openzeppelin/transaction-form-types/transactions/status';

import { cn } from '../../utils/cn';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { ExternalLink } from '../ui/external-link';

interface TransactionStatusDisplayProps {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  explorerUrl?: string | null; // URL for the transaction hash link
  onClose?: () => void; // Callback to close/reset the display
  className?: string; // Allow custom styling
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
  let icon: React.ReactNode = <Info className="h-4 w-4" />;
  let content: React.ReactNode = null;

  if (status === 'pendingSignature') {
    title = 'Pending Signature';
    icon = <Loader2 className="h-4 w-4 animate-spin" />;
    content = <p>Please check your connected wallet to sign the transaction.</p>;
    variant = 'default';
  } else if (status === 'pendingConfirmation') {
    title = 'Processing Transaction';
    icon = <Loader2 className="h-4 w-4 animate-spin" />;
    content = <p>Waiting for the transaction to be confirmed on the blockchain...</p>;
    variant = 'default';
  } else if (status === 'success') {
    title = 'Transaction Successful';
    icon = <CheckCircle className="h-4 w-4" />;
    content = (
      <div className="flex flex-col space-y-1">
        <p>Your transaction has been confirmed.</p>
        {txHash && (
          <p className="text-sm">
            Hash:{' '}
            {explorerUrl ? (
              <ExternalLink href={explorerUrl} className="break-all">
                {txHash}
              </ExternalLink>
            ) : (
              <span className="break-all">{txHash}</span>
            )}
          </p>
        )}
      </div>
    );
    variant = 'success';
  } else if (status === 'error') {
    title = 'Transaction Failed';
    icon = <AlertCircle className="h-4 w-4" />;
    content = <p>{error || 'An unknown error occurred.'}</p>;
    variant = 'destructive';
  }

  return (
    <Alert variant={variant} className={cn('relative', className)}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{content}</AlertDescription>
      {onClose && (status === 'success' || status === 'error') && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
