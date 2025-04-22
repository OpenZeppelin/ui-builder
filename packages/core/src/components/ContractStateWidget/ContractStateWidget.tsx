import { FileText, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';
import type {
  ChainType,
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import { getContractAdapter } from '../../adapters';
import { truncateMiddle } from '../../core/utils/general';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { ViewFunctionsPanel } from './components/ViewFunctionsPanel';

interface ContractStateWidgetProps {
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  chainType: ChainType;
  isVisible?: boolean;
  onToggle?: () => void;
}

/**
 * SidebarContractStateWidget - Compact widget designed specifically for sidebar display
 * Shows contract state by allowing users to query simple view functions (no parameters)
 */
export function ContractStateWidget({
  contractSchema,
  contractAddress,
  chainType,
  isVisible = true,
  onToggle,
}: ContractStateWidgetProps) {
  const [viewFunctions, setViewFunctions] = useState<ContractFunction[]>([]);
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >(isVisible ? 'entered' : 'exited');

  const adapter = getContractAdapter(chainType);

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
      className={`mb-2 overflow-hidden p-0
        transition-all duration-300 ease-in-out
        ${
          animationState === 'entering' || animationState === 'entered'
            ? 'opacity-100 transform scale-100 translate-y-0'
            : 'opacity-0 transform scale-95 -translate-y-2'
        }
      `}
    >
      <CardHeader className="pb-1 pt-2 px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Contract State</CardTitle>
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleToggle}
            title="Hide Contract State"
          >
            <X size={14} />
            <span className="sr-only">Hide Contract State</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 px-3 py-1">
        {viewFunctions.length > 0 ? (
          <ViewFunctionsPanel
            functions={viewFunctions}
            contractAddress={contractAddress}
            adapter={adapter}
            contractSchema={contractSchema}
          />
        ) : (
          <div className="text-xs text-muted-foreground">No simple view functions found</div>
        )}
      </CardContent>
    </Card>
  );
}
