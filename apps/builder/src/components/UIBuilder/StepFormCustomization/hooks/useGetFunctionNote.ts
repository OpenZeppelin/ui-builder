import { useEffect, useState } from 'react';

import type { ContractAdapter, ContractFunction } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

/**
 * Custom hook to fetch function decoration notes from the adapter.
 * Handles fetching and caching the function note based on the selected function.
 *
 * @param adapter - The contract adapter (from wallet state or props)
 * @param selectedFunction - The currently selected function ID
 * @param selectedFunctionDetails - Details of the selected function
 * @returns The function note or undefined if not found/not required
 */
export function useGetFunctionNote(
  adapter: ContractAdapter | undefined,
  selectedFunction: string | null,
  selectedFunctionDetails: ContractFunction | null
): { title?: string; body: string } | undefined {
  const [functionNote, setFunctionNote] = useState<{ title?: string; body: string } | undefined>();

  useEffect(() => {
    if (!adapter?.getFunctionDecorations || !selectedFunction || !selectedFunctionDetails?.id) {
      setFunctionNote(undefined);
      return;
    }

    const fetchDecorations = async () => {
      try {
        if (typeof adapter.getFunctionDecorations !== 'function') {
          setFunctionNote(undefined);
          return;
        }

        const decorations = await adapter.getFunctionDecorations();
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
  }, [adapter, selectedFunction, selectedFunctionDetails?.id]);

  return functionNote;
}
