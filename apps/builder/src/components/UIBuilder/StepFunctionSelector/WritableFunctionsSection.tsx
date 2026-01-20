import { useEffect, useState } from 'react';

import type { ContractAdapter, FunctionDecorationsMap } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { WritableFunctionsSectionProps } from './types';
import { WritableFunctionRow } from './WritableFunctionRow';

export function WritableFunctionsSection({
  functions,
  selectedFunction,
  onSelectFunction,
  adapter,
}: WritableFunctionsSectionProps & { adapter?: ContractAdapter }) {
  const [decorations, setDecorations] = useState<FunctionDecorationsMap | undefined>();

  // Fetch function decorations when adapter is available
  useEffect(() => {
    if (!adapter?.getFunctionDecorations) {
      return;
    }

    const fetchDecorations = async () => {
      try {
        const result = await adapter.getFunctionDecorations!();
        if (result) {
          setDecorations(result);
          logger.debug('WritableFunctionsSection', 'Function decorations loaded');
        }
      } catch (error) {
        logger.warn('WritableFunctionsSection', 'Failed to fetch function decorations', error);
      }
    };

    void fetchDecorations();
  }, [adapter]);

  return (
    <div className="space-y-2">
      <h4 className="text-md font-medium">Writable Functions</h4>
      {functions.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center">
          No writable functions found in this contract.
        </p>
      ) : (
        functions.map((fn) => (
          <WritableFunctionRow
            key={fn.id}
            fn={fn}
            isSelected={selectedFunction === fn.id}
            onSelect={onSelectFunction}
            decoration={decorations?.[fn.id]}
          />
        ))
      )}
    </div>
  );
}
