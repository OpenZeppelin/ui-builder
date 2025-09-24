/**
 * Hook for managing field selection in the form customization UI
 */
export function useFieldSelection({
  onSelectField,
}: {
  onSelectField: (index: number | null) => void;
}) {
  const selectField = (index: number) => {
    onSelectField(index);
  };

  const clearSelection = () => {
    onSelectField(null);
  };

  return {
    selectField,
    clearSelection,
  };
}
