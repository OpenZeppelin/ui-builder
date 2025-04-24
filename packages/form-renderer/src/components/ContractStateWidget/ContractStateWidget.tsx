import { FileText, Minimize2 } from 'lucide-react';

import { useEffect, useState } from 'react';

import type { FullContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import type {
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import { truncateMiddle } from '../../utils/formatting';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { ViewFunctionsPanel } from './components/ViewFunctionsPanel';

interface ContractStateWidgetProps {
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  adapter: FullContractAdapter; // Changed from chainType to adapter
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * ContractStateWidget - Compact widget for displaying contract state
 * Shows contract state by allowing users to query simple view functions (no parameters)
 */
export function ContractStateWidget({
  contractSchema,
  contractAddress,
  adapter, // Using adapter directly
  isVisible = true,
  onToggle,
  className,
}: ContractStateWidgetProps) {
  const [viewFunctions, setViewFunctions] = useState<ContractFunction[]>([]);
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >(isVisible ? 'entered' : 'exited');

  useEffect(() => {
    if (!contractSchema) return;
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
      return () => clearTimeout(timer);
    } else {
      setAnimationState('exiting');
      const timer = setTimeout(() => {
        setAnimationState('exited');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  if (!contractSchema || !contractAddress) {
    return null; // Don't show the widget at all if no contract is loaded
  }

  // If widget is hidden, render just a compact floating button
  if (!isVisible) {
    return (
      <div className="relative h-0 w-full">
        <div className="absolute right-0 top-0">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-2 rounded-full shadow-sm hover:bg-primary hover:text-primary-foreground
              transition-all duration-300 ease-in-out
              ${animationState === 'exited' ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
            `}
            onClick={handleToggle}
            title={`Show Contract State`}
          >
            <FileText size={16} className="shrink-0" />
            <span className="text-xs font-medium">{truncateMiddle(contractAddress)}</span>
          </Button>
        </div>
      </div>
    );
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
        {viewFunctions.length > 0 ? (
          <ViewFunctionsPanel
            functions={viewFunctions}
            contractAddress={contractAddress}
            adapter={adapter}
            contractSchema={contractSchema}
            className="flex-grow flex flex-col min-h-0"
          />
        ) : (
          <div className="text-xs text-muted-foreground">No simple view functions found</div>
        )}
      </CardContent>
    </Card>
  );
}
