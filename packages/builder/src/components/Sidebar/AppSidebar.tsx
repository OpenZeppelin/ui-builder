import { ChevronLeft, ChevronRight, FileText, Plus, Upload } from 'lucide-react';

import { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import ContractUIImportDialog from './ContractUIs/ContractUIImportDialog';
import ContractUIsList from './ContractUIs/ContractUIsList';

interface AppSidebarProps {
  className?: string;
  onLoadContractUI?: (id: string) => void;
}

export default function AppSidebar({ className, onLoadContractUI }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Persist sidebar state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-open');
    if (stored !== null) {
      setIsOpen(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(isOpen));
  }, [isOpen]);

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-background shadow-lg transition-all duration-300',
          isOpen ? 'w-80' : 'w-16',
          className
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-10 top-6 flex h-8 w-8 items-center justify-center rounded-r-md bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Sidebar Content */}
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isOpen && <h2 className="text-lg font-semibold">Contract UIs</h2>}
            </div>
            {isOpen && (
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
                  onClick={() => {
                    // Trigger new Contract UI creation
                    window.location.reload();
                  }}
                  title="Create New Contract UI"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-hidden">
            {isOpen ? (
              <ContractUIsList onLoadContractUI={onLoadContractUI} />
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2">
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
                  onClick={() => window.location.reload()}
                  title="Create New"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Spacer to push content */}
      <div className={cn('transition-all duration-300', isOpen ? 'w-80' : 'w-16')} />
    </>
  );
}
