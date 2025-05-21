/*------------TEMPLATE COMMENT START------------*/
/**
 * Form Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
/*------------TEMPLATE COMMENT START------------*/
// This import will be replaced at generation time
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - Adapter import placeholder
import { AdapterPlaceholder } from '@@adapter-package-name@@';

import { useState } from 'react';

import { ContractStateWidget, TransactionForm } from '@openzeppelin/transaction-form-renderer';
import type {
  ContractSchema,
  ExecutionConfig,
  RenderFormSchema,
} from '@openzeppelin/transaction-form-types';
import { Card, CardContent } from '@openzeppelin/transaction-form-ui';

// Props for GeneratedForm
interface GeneratedFormProps {
  adapter: AdapterPlaceholder;
  isWalletConnected?: boolean;
}

/**
 * Generated Transaction Form for @@function-id@@
 *
 * This component renders a form for interacting with a blockchain contract.
 * It uses the shared form-renderer package which ensures consistent behavior
 * with the preview in the form builder.
 */
export default function GeneratedForm({ adapter, isWalletConnected }: GeneratedFormProps) {
  // TODO: Enable this useEffect as a fallback?
  // If the adapter supports runtime schema loading (e.g., via Etherscan)
  // and the injected schema is missing or invalid, this could attempt to load it.
  /*
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  */
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [loadError, _setLoadError] = useState<Error | null>(null);
  // Form schema generated from the builder and transformed by FormSchemaFactory
  /*------------TEMPLATE COMMENT START------------*/
  // This is an empty object that will be replaced at generation time with a properly
  // transformed RenderFormSchema that includes all necessary properties
  /*------------TEMPLATE COMMENT END------------*/
  // @ts-expect-error - Placeholder
  const formSchema: RenderFormSchema = {}; /*@@FORM_SCHEMA_JSON@@*/

  // Contract schema injected by generator (loaded or uploaded by the user)
  /*------------TEMPLATE COMMENT START------------*/
  // This is an empty object that will be replaced at generation time with a properly
  // transformed ContractSchema that includes all necessary properties
  /*------------TEMPLATE COMMENT END------------*/
  // @ts-expect-error - Placeholder
  const contractSchema: ContractSchema = {}; /*@@CONTRACT_SCHEMA_JSON@@*/

  // Execution configuration selected in the builder
  /*------------TEMPLATE COMMENT START------------*/
  // This will be replaced at generation time with the stringified ExecutionConfig or 'undefined'.
  // Use 'unknown' for the placeholder type. Assign undefined and use comment marker for replacement.
  /*------------TEMPLATE COMMENT END------------*/
  const executionConfig: ExecutionConfig | undefined = undefined; /*@@EXECUTION_CONFIG_JSON@@*/
  // TODO (Export Integration): Use executionConfig at runtime to determine
  // how to sign/broadcast (e.g., standard EOA signing, Safe interaction, relayer API).

  const contractAddress = formSchema.contractAddress;

  // TODO: Enable this useEffect as a fallback?
  // If the adapter supports runtime schema loading (e.g., via Etherscan)
  // and the injected schema is missing or invalid, this could attempt to load it.
  /*
  useEffect(() => {
    setLoadError(null);
    setContractSchema(null);

    if (contractAddress) {
      adapter
        .loadContract(contractAddress)
        .then(setContractSchema)
        .catch((err: unknown) => {
          // Catch error during contract loading
          logger.error('GeneratedForm', 'Error loading contract schema:', err);
          // Create a new Error object if caught value is not already one
          const errorToSet =
            err instanceof Error ? err : new Error('Failed to load contract state');
          setLoadError(errorToSet);
          setContractSchema(null);
        });
    } else {
      setContractSchema(null);
    }
  }, [contractAddress, adapter]);
  */

  // Decide which schema to use: prioritize injected, fallback maybe later?
  const schemaToUse = contractSchema; // Sticking to injected schema for now

  const toggleWidget = () => {
    setIsWidgetVisible((prev: boolean) => !prev);
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <Card>
          <CardContent className="space-y-4">
            <TransactionForm
              schema={formSchema}
              contractSchema={contractSchema}
              adapter={adapter}
              isWalletConnected={isWalletConnected}
              executionConfig={executionConfig}
            />
          </CardContent>
        </Card>
      </div>

      {contractAddress && (
        <div className="w-[300px] flex-shrink-0">
          <div className="sticky top-4">
            <ContractStateWidget
              contractSchema={schemaToUse}
              contractAddress={contractAddress}
              adapter={adapter}
              isVisible={isWidgetVisible}
              onToggle={toggleWidget}
              error={loadError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
