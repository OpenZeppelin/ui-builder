import { FileText, Loader2, Minimize2 } from 'lucide-react';

import { JSX, useEffect, useState } from 'react';

import type {
  ContractFunction,
  ContractSchema,
  FullContractAdapter,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@openzeppelin/contracts-ui-builder-ui';

import { ViewFunctionsPanel } from './components/ViewFunctionsPanel';

interface ContractStateWidgetProps {
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  adapter: FullContractAdapter;
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
  error?: Error | null;
}

/**
 * ContractStateWidget - Compact widget for displaying contract state
 * Shows contract state by allowing users to query simple view functions (no parameters)
 */
export function ContractStateWidget({
  contractSchema,
  contractAddress,
  adapter,
  isVisible = true,
  onToggle,
  className,
  error,
}: ContractStateWidgetProps): JSX.Element | null {
  const [viewFunctions, setViewFunctions] = useState<ContractFunction[]>([]);
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >(isVisible ? 'entered' : 'exited');

  const networkConfig = adapter?.networkConfig;

  useEffect(() => {
    if (!contractSchema || !adapter) return;
    // Filter functions to only simple view functions (no parameters)
    const viewFns = contractSchema.functions.filter((fn) => adapter.isViewFunction(fn));
    setViewFunctions(viewFns.filter((fn) => fn.inputs.length === 0));
  }, [contractSchema, adapter]);

  // Control the animation state based on isVisible prop changes
  useEffect(() => {
    if (isVisible) {
      setAnimationState('entering');
      const timer = setTimeout(() => {
        setAnimationState('entered');
      }, 300);
      return (): void => clearTimeout(timer);
    } else {
      setAnimationState('exiting');
      const timer = setTimeout(() => {
        setAnimationState('exited');
      }, 300);
      return (): void => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
    }
  };

  if (!contractAddress || !adapter || !networkConfig) {
    return null;
  }

  // If widget is hidden, don't render anything
  if (!isVisible) {
    return null;
  }

  return (
    <Card
      className={`mb-2 overflow-hidden p-0 gap-0 flex flex-col h-full ${className || ''}
        transition-all duration-300 ease-in-out
        ${
          animationState === 'entering' || animationState === 'entered'
            ? 'opacity-100 transform scale-100 translate-y-0'
            : 'opacity-0 transform scale-95 -translate-y-2'
        }
      `}
    >
      <CardHeader className="pb-2 pt-2 px-3 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Contract State</CardTitle>
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleToggle}
            title="Minimize Contract State"
          >
            <Minimize2 size={14} />
            <span className="sr-only">Minimize Contract State</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-3 py-2 flex-grow overflow-hidden flex flex-col min-h-0">
        {error ? (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3 flex flex-col items-center justify-center h-full">
            <p className="font-medium text-center">Error loading contract state</p>
            <p className="mt-1 text-xs text-center">{error.message}</p>
          </div>
        ) : !contractSchema || !adapter ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 py-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin opacity-70" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Loading contract info...</p>
              <p className="text-xs text-muted-foreground">
                Retrieving contract data and available functions
              </p>
            </div>
          </div>
        ) : viewFunctions.length > 0 ? (
          <ViewFunctionsPanel
            functions={viewFunctions}
            contractAddress={contractAddress}
            adapter={adapter}
            contractSchema={contractSchema}
            className="flex-grow flex flex-col min-h-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-4 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No simple view functions found</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[220px]">
              This contract doesn&apos;t have any simple view functions that can be queried without
              parameters
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
