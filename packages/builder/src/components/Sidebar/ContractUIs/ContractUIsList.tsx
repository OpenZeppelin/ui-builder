import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { Button } from '@openzeppelin/contracts-ui-builder-ui';

import ContractUIItem from './ContractUIItem';

interface ContractUIsListProps {
  onLoadContractUI?: (id: string) => void;
  currentLoadedConfigurationId?: string | null;
}

export default function ContractUIsList({
  onLoadContractUI,
  currentLoadedConfigurationId,
}: ContractUIsListProps) {
  const {
    contractUIs,
    isLoading,
    exportContractUIs,
    deleteContractUI,
    duplicateContractUI,
    updateContractUI,
  } = useContractUIStorage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (contractUIs && selectedIds.size === contractUIs.length) {
      setSelectedIds(new Set());
    } else if (contractUIs) {
      setSelectedIds(new Set(contractUIs.map((ui) => ui.id)));
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size > 0) {
      await exportContractUIs(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
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
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b bg-muted/50 p-2">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSelectAll}>
              {selectedIds.size === contractUIs.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void handleExportSelected()}>
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {contractUIs.map((contractUI) => (
          <ContractUIItem
            key={contractUI.id}
            contractUI={contractUI}
            isSelected={selectedIds.has(contractUI.id)}
            isCurrentlyLoaded={currentLoadedConfigurationId === contractUI.id}
            onToggleSelect={handleToggleSelect}
            onLoad={() => onLoadContractUI?.(contractUI.id)}
            onDelete={() => deleteContractUI(contractUI.id)}
            onDuplicate={() => duplicateContractUI(contractUI.id)}
            onRename={(newTitle) => updateContractUI(contractUI.id, { title: newTitle })}
            onExport={() => exportContractUIs([contractUI.id])}
          />
        ))}
      </div>
    </div>
  );
}
