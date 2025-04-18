import { FileText, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';
import type {
  ChainType,
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import { getContractAdapter } from '../../adapters';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { ParameterizedFunctionsPanel } from './components/ParameterizedFunctionsPanel';
import { ViewFunctionsPanel } from './components/ViewFunctionsPanel';

interface ContractStateWidgetProps {
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  chainType: ChainType;
  isVisible?: boolean;
  onToggle?: () => void;
}

/**
 * Truncates a string (like an Ethereum address) in the middle
 * @param str The string to truncate
 * @param startChars Number of characters to show at the beginning
 * @param endChars Number of characters to show at the end
 * @returns The truncated string with ellipsis in the middle
 */
function truncateMiddle(str: string, startChars = 6, endChars = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;

  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}

/**
 * SidebarContractStateWidget - Compact widget designed specifically for sidebar display
 * Shows contract state by allowing users to query view functions, split into:
 * 1. Simple view functions (no parameters)
 * 2. Parameterized view functions (require input)
 */
export function ContractStateWidget({
  contractSchema,
  contractAddress,
  chainType,
  isVisible = true,
  onToggle,
}: ContractStateWidgetProps) {
  const [viewFunctions, setViewFunctions] = useState<ContractFunction[]>([]);
  const [parameteredFunctions, setParameteredFunctions] = useState<ContractFunction[]>([]);
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >(isVisible ? 'entered' : 'exited');

  const adapter = getContractAdapter(chainType);

  useEffect(() => {
    if (!contractSchema) return;
    // Filter functions into view/non-view and parameterized/non-parameterized
    const viewFns = contractSchema.functions.filter((fn) => adapter.isViewFunction(fn));

    setViewFunctions(viewFns.filter((fn) => fn.inputs.length === 0));
    setParameteredFunctions(viewFns.filter((fn) => fn.inputs.length > 0));
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
      className={`mb-2 overflow-hidden
        transition-all duration-300 ease-in-out
        ${
          animationState === 'entering' || animationState === 'entered'
            ? 'opacity-100 transform scale-100 translate-y-0'
            : 'opacity-0 transform scale-95 -translate-y-2'
        }
      `}
    >
      <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
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
      <CardContent className="space-y-2 px-3 py-2">
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7">
            <TabsTrigger value="simple" className="text-xs py-1">
              Simple ({viewFunctions.length})
            </TabsTrigger>
            <TabsTrigger value="parameterized" className="text-xs py-1">
              Param ({parameteredFunctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="pt-2 space-y-2">
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
          </TabsContent>

          <TabsContent value="parameterized" className="pt-2 space-y-2">
            {parameteredFunctions.length > 0 ? (
              <ParameterizedFunctionsPanel
                functions={parameteredFunctions}
                contractAddress={contractAddress}
                adapter={adapter}
                contractSchema={contractSchema}
              />
            ) : (
              <div className="text-xs text-muted-foreground">No parameterized functions found</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
