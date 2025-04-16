import { useEffect, useState } from 'react';

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
}

/**
 * ContractStateWidget displays contract state by allowing users to query view functions.
 * It separates functions into two categories:
 * 1. Simple view functions (no parameters) - can be queried all at once
 * 2. Parameterized view functions - require user input before querying
 */
export function ContractStateWidget({
  contractSchema,
  contractAddress,
  chainType,
}: ContractStateWidgetProps) {
  const [viewFunctions, setViewFunctions] = useState<ContractFunction[]>([]);
  const [parameteredFunctions, setParameteredFunctions] = useState<ContractFunction[]>([]);

  const adapter = getContractAdapter(chainType);

  useEffect(() => {
    if (!contractSchema) return;
    // Filter functions into view/non-view and parameterized/non-parameterized
    const viewFns = contractSchema.functions.filter((fn) => adapter.isViewFunction(fn));

    setViewFunctions(viewFns.filter((fn) => fn.inputs.length === 0));
    setParameteredFunctions(viewFns.filter((fn) => fn.inputs.length > 0));
  }, [contractSchema, adapter]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Contract State</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Views ({viewFunctions.length})</TabsTrigger>
            <TabsTrigger value="parameterized">
              Parameterized ({parameteredFunctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="pt-4 space-y-4">
            {contractAddress ? (
              <ViewFunctionsPanel
                functions={viewFunctions}
                contractAddress={contractAddress}
                adapter={adapter}
                contractSchema={
                  contractSchema ?? {
                    chainType,
                    name: '',
                    functions: [],
                  }
                }
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Please enter a contract address to query functions
              </div>
            )}
          </TabsContent>

          <TabsContent value="parameterized" className="pt-4 space-y-4">
            {contractAddress ? (
              <ParameterizedFunctionsPanel
                functions={parameteredFunctions}
                contractAddress={contractAddress}
                adapter={adapter}
                contractSchema={
                  contractSchema ?? {
                    chainType,
                    name: '',
                    functions: [],
                  }
                }
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Please enter a contract address to query functions
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
