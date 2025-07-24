import { Loader2 } from 'lucide-react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';

import ContractUIItem from './ContractUIItem';

interface ContractUIsListProps {
  onLoadContractUI?: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
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

  const handleRename = async (contractUIId: string, newTitle: string): Promise<void> => {
    await updateContractUI(contractUIId, {
      title: newTitle,
      metadata: { isManuallyRenamed: true },
    });
  };

  const handleDelete = async (contractUIId: string): Promise<void> => {
    const isDeletingCurrentRecord = currentLoadedConfigurationId === contractUIId;
    await deleteContractUI(contractUIId);

    if (isDeletingCurrentRecord && onResetAfterDelete) {
      onResetAfterDelete();
    }
  };

  const handleExport = async (contractUIId: string): Promise<void> => {
    await exportContractUIs([contractUIId]);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contractUIs || contractUIs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="mb-2">No saved Contract UIs yet</p>
        <p className="text-sm">Create your first one or import existing configurations</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {contractUIs.map((contractUI) => (
            <ContractUIItem
              key={contractUI.id}
              contractUI={contractUI}
              isCurrentlyLoaded={currentLoadedConfigurationId === contractUI.id}
              onLoad={() => onLoadContractUI?.(contractUI.id)}
              onDelete={() => handleDelete(contractUI.id)}
              onDuplicate={async () => {
                await duplicateContractUI(contractUI.id);
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
