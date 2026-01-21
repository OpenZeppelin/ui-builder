import { Loader2 } from 'lucide-react';

import { useContractUIStorage } from '../../../contexts/useContractUIStorage';
import { useStorageOperations } from '../../../hooks/useStorageOperations';
import type { ContractUIRecord } from '../../../storage';
import { recordHasMeaningfulContent } from '../../UIBuilder/utils/meaningfulContent';
import ContractUIItem from './ContractUIItem';

interface ContractUIsListProps {
  onLoadContractUI?: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Determines if a record should be shown in the sidebar.
 * Filters out empty records unless they're manually renamed or currently loaded.
 */
function shouldShowRecord(
  record: ContractUIRecord,
  currentLoadedConfigurationId: string | null
): boolean {
  // Always show the currently loaded record, even if it's empty
  if (currentLoadedConfigurationId === record.id) {
    return true;
  }

  // Use the shared logic for meaningful content detection
  return recordHasMeaningfulContent(record);
}

export default function ContractUIsList({
  onLoadContractUI,
  onResetAfterDelete,
  currentLoadedConfigurationId,
}: ContractUIsListProps) {
  const {
    contractUIs,
    isLoading,
    deleteContractUI,
    duplicateContractUI,
    updateContractUI,
    exportContractUIs,
  } = useContractUIStorage();
  const storageOperations = useStorageOperations();

  const handleRename = async (contractUIId: string, newTitle: string): Promise<void> => {
    await updateContractUI(contractUIId, {
      title: newTitle,
      metadata: { isManuallyRenamed: true },
    });
  };

  const handleDelete = async (contractUIId: string): Promise<void> => {
    const isDeletingCurrentRecord = currentLoadedConfigurationId === contractUIId;

    try {
      storageOperations.setDeleting(contractUIId, true);
      await deleteContractUI(contractUIId);

      if (isDeletingCurrentRecord && onResetAfterDelete) {
        onResetAfterDelete();
      }
    } finally {
      storageOperations.setDeleting(contractUIId, false);
    }
  };

  const handleExport = async (contractUIId: string): Promise<void> => {
    try {
      storageOperations.setExporting(contractUIId, true);
      await exportContractUIs([contractUIId]);
    } finally {
      storageOperations.setExporting(contractUIId, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter contracts to hide empty records (unless they meet certain criteria)
  const visibleContractUIs =
    contractUIs?.filter((contractUI) =>
      shouldShowRecord(contractUI, currentLoadedConfigurationId ?? null)
    ) || [];

  // Return null if no visible items - the parent will hide the entire section
  if (visibleContractUIs.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {visibleContractUIs.map((contractUI) => (
            <ContractUIItem
              key={contractUI.id}
              contractUI={contractUI}
              isCurrentlyLoaded={currentLoadedConfigurationId === contractUI.id}
              onLoad={() => onLoadContractUI?.(contractUI.id)}
              onDelete={() => handleDelete(contractUI.id)}
              onDuplicate={async () => {
                try {
                  storageOperations.setDuplicating(contractUI.id, true);
                  await duplicateContractUI(contractUI.id);
                } finally {
                  storageOperations.setDuplicating(contractUI.id, false);
                }
              }}
              onRename={(newTitle) => handleRename(contractUI.id, newTitle)}
              onExport={() => handleExport(contractUI.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
