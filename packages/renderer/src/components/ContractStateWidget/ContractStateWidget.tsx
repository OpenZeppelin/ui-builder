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
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

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

  useEffect((): void => {
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
      }, 500);
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

  // Keep mounted to allow exit animation on mobile. We'll hide on desktop via classes.

  return (
    <Card
      className={cn(
        'overflow-hidden p-0 gap-0 flex flex-col transition-transform duration-500 ease-in-out will-change-transform transform-gpu',
        // Mobile: slide from bottom using translate classes
        animationState === 'entering' || animationState === 'entered'
          ? 'translate-y-0'
          : 'translate-y-[120%]',
        // Desktop: subtle scale/opacity
        animationState === 'entering' || animationState === 'entered'
          ? 'md:scale-100 md:opacity-100'
          : 'md:scale-95 md:opacity-0',
        // Mobile: fixed overlay positioned at bottom
        'fixed bottom-4 inset-x-4 z-[9999] max-h-[50vh] shadow-xl bg-background backdrop-blur-md rounded-lg border border-border',
        // Desktop: relative positioned card in sidebar
        'md:relative md:inset-auto md:bottom-auto md:shadow-none md:bg-card md:backdrop-blur-none md:z-auto md:mb-2 md:max-h-160',
        // Prevent interactions while animating out; hide entirely on desktop when exited
        (animationState === 'exiting' || animationState === 'exited') && 'pointer-events-none',
        animationState === 'exited' && 'md:hidden',
        className
      )}
      aria-hidden={animationState === 'exited'}
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
      <CardContent className="space-y-3 px-3 py-2 flex-grow overflow-y-auto flex flex-col min-h-0">
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
