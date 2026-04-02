import { useEffect, useState } from 'react';

import type { FunctionDecorationsMap } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

import { WritableFunctionsSectionProps } from './types';
import { WritableFunctionRow } from './WritableFunctionRow';

export function WritableFunctionsSection({
  functions,
  selectedFunction,
  onSelectFunction,
  runtime,
}: WritableFunctionsSectionProps & { runtime?: BuilderRuntime }) {
  const [decorations, setDecorations] = useState<FunctionDecorationsMap | undefined>();

  // Fetch function decorations when runtime is available
  useEffect(() => {
    if (!runtime?.schema?.getFunctionDecorations) {
      return;
    }

    const fetchDecorations = async () => {
      try {
        const result = await runtime.schema.getFunctionDecorations!();
        if (result) {
          setDecorations(result);
          logger.debug('WritableFunctionsSection', 'Function decorations loaded');
        }
      } catch (error) {
        logger.warn('WritableFunctionsSection', 'Failed to fetch function decorations', error);
      }
    };

    void fetchDecorations();
  }, [runtime]);

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
