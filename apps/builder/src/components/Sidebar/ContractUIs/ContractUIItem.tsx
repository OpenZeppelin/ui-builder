import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@openzeppelin/ui-components';
import { cn } from '@openzeppelin/ui-utils';

import { useTypewriterEffect } from './hooks/useTypewriterEffect';

import { useContractUIOperationState } from '../../../hooks/useStorageOperations';
import type { ContractUIRecord } from '../../../storage';
import ContractUIDeleteDialog from './ContractUIDeleteDialog';
import ContractUIRenameDialog from './ContractUIRenameDialog';

interface ContractUIItemProps {
  contractUI: ContractUIRecord;
  isCurrentlyLoaded?: boolean;
  onLoad: () => void;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onRename: (newTitle: string) => Promise<void>;
  onExport: () => Promise<void>;
}

export default function ContractUIItem({
  contractUI,
  isCurrentlyLoaded = false,
  onLoad,
  onDelete,
  onDuplicate,
  onRename,
  onExport,
}: ContractUIItemProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  // Typewriter effect for title changes
  const { displayText: animatedTitle, isAnimating: isTitleAnimating } = useTypewriterEffect(
    contractUI.title,
    {
      typingSpeed: 40,
      erasingSpeed: 25,
      eraseDelay: 150,
      typeDelay: 100,
    }
  );

  // Get operation state for progress indicators
  const operationState = useContractUIOperationState(contractUI.id);

  // Artificially prolong the animation for better visibility
  useEffect(() => {
    if (operationState.isAnyOperationInProgress) {
      setShowLoadingAnimation(true);
    } else if (showLoadingAnimation) {
      // Keep animation visible for an additional 1.5 seconds after operation completes
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [operationState.isAnyOperationInProgress, showLoadingAnimation]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        onClick={onLoad}
        className={cn(
          'group relative flex h-11 w-[225px] cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-300 ease-in-out',
          // Background animation for operations in progress (with artificial delay)
          showLoadingAnimation && 'animate-pulse bg-muted opacity-30 [animation-duration:1200ms]',
          // Selected / hover — align with `SidebarButton` (`text-selected bg-selected/10`)
          !showLoadingAnimation &&
            (isCurrentlyLoaded
              ? 'bg-selected/10 text-selected'
              : 'text-muted-foreground hover:bg-muted/50')
        )}
      >
        {/* Content */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">
              {animatedTitle}
              {isTitleAnimating && <span className="animate-pulse text-current">|</span>}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 self-stretch" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-full w-5 p-0 transition-opacity',
                  isCurrentlyLoaded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onDuplicate()}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onExport()}>Export</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialogs */}
      <ContractUIRenameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        currentTitle={contractUI.title}
        onRename={onRename}
      />
      <ContractUIDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={contractUI.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
