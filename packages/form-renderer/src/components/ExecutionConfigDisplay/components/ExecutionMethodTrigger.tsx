import { AlertCircle, Info, Key, Shield, User, Users } from 'lucide-react';

import React from 'react';

import type { ExecutionConfig } from '@openzeppelin/transaction-form-types';
import { DialogTrigger } from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

interface ExecutionMethodTriggerProps {
  executionConfig: ExecutionConfig;
  isValid: boolean;
  error?: string;
  className?: string;
}

export const ExecutionMethodTrigger: React.FC<ExecutionMethodTriggerProps> = ({
  executionConfig,
  isValid,
  error,
  className,
}) => {
  // Get the appropriate icon for the execution method
  const getMethodIcon = (method: string): React.ReactNode => {
    switch (method) {
      case 'eoa':
        return <User className="size-3.5 text-primary" />;
      case 'relayer':
        return <Shield className="size-3.5 text-primary" />;
      case 'multisig':
        return <Users className="size-3.5 text-primary" />;
      default:
        return <Key className="size-3.5 text-muted" />;
    }
  };

  return (
    <DialogTrigger
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md border group',
        'transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
        !isValid
          ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-50/80'
          : 'border-slate-200 bg-white text-slate-700',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {getMethodIcon(executionConfig.method)}
        <span className="font-semibold">Execution:</span>
        <span className="uppercase">{executionConfig.method}</span>
      </div>

      <div className="flex items-center ml-2">
        {!isValid ? (
          <AlertCircle className="size-3.5 text-red-500" />
        ) : (
          <Info className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
        )}
      </div>

      {/* Show error message on hover when invalid */}
      {!isValid && error && (
        <div className="sr-only group-hover:not-sr-only group-hover:absolute group-hover:top-full group-hover:left-0 group-hover:mt-1 group-hover:px-2 group-hover:py-1 group-hover:bg-red-900 group-hover:text-white group-hover:text-xs group-hover:rounded group-hover:shadow-lg group-hover:z-50 group-hover:max-w-xs">
          {error}
        </div>
      )}
    </DialogTrigger>
  );
};
