import { useEffect, useState } from 'react';

import type { ContractFunction } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

/**
 * Custom hook to fetch function decoration notes from the runtime.
 * Handles fetching and caching the function note based on the selected function.
 *
 * @param runtime - The builder runtime (from wallet state or props)
 * @param selectedFunction - The currently selected function ID
 * @param selectedFunctionDetails - Details of the selected function
 * @returns The function note or undefined if not found/not required
 */
export function useGetFunctionNote(
  runtime: BuilderRuntime | undefined,
  selectedFunction: string | null,
  selectedFunctionDetails: ContractFunction | null
): { title?: string; body: string } | undefined {
  const [functionNote, setFunctionNote] = useState<{ title?: string; body: string } | undefined>();

  useEffect(() => {
    if (
      !runtime?.schema.getFunctionDecorations ||
      !selectedFunction ||
      !selectedFunctionDetails?.id
    ) {
      setFunctionNote(undefined);
      return;
    }

    const fetchDecorations = async () => {
      try {
        if (typeof runtime.schema.getFunctionDecorations !== 'function') {
          setFunctionNote(undefined);
          return;
        }

        const decorations = await runtime.schema.getFunctionDecorations();
        if (decorations && selectedFunctionDetails.id && decorations[selectedFunctionDetails.id]) {
          setFunctionNote(decorations[selectedFunctionDetails.id].note);
        } else {
          setFunctionNote(undefined);
        }
      } catch (error) {
        logger.warn('useGetFunctionNote', 'Failed to fetch function decorations', error);
        setFunctionNote(undefined);
      }
    };

    void fetchDecorations();
  }, [runtime, selectedFunction, selectedFunctionDetails?.id]);

  return functionNote;
}
