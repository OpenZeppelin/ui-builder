import { useCallback, useState } from 'react';

/**
 * Hook for managing network selection state in the Contracts UI Builder.
 * Tracks the selected network configuration ID.
 */
export function useNetworkSelectionState(initialNetworkConfigId: string | null = null) {
  const [selectedNetworkConfigId, setSelectedNetworkConfigId] = useState<string | null>(
    initialNetworkConfigId
  );

  // Note: We store the ID, not the full config object, to keep state light.
  // The full config can be retrieved using the NetworkService when needed.
  const handleNetworkSelect = useCallback((networkConfigId: string | null) => {
    setSelectedNetworkConfigId(networkConfigId);
  }, []);

  const resetNetworkSelection = useCallback(() => {
    setSelectedNetworkConfigId(null);
  }, []);

  return {
    selectedNetworkConfigId,
    handleNetworkSelect,
    resetNetworkSelection,
  };
}
