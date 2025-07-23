import { FileText, Plus, Upload } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import ContractUIImportDialog from './ContractUIs/ContractUIImportDialog';
import ContractUIsList from './ContractUIs/ContractUIsList';

interface AppSidebarProps {
  className?: string;
  onLoadContractUI?: (id: string) => void;
  onCreateNew?: () => void;
}

export default function AppSidebar({ className, onLoadContractUI, onCreateNew }: AppSidebarProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <div className={cn('fixed left-0 top-0 z-40 h-full w-80 bg-background shadow-lg', className)}>
        {/* Sidebar Content */}
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Contract UIs</h2>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowImportDialog(true)}
                title="Import Contract UIs"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onCreateNew}
                title="Create New Contract UI"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-hidden">
            <ContractUIsList onLoadContractUI={onLoadContractUI} />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Spacer to push content */}
      <div className="w-80" />
    </>
  );
}
