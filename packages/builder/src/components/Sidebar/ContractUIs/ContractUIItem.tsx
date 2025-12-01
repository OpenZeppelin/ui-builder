import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@openzeppelin/ui-builder-ui';
import { cn } from '@openzeppelin/ui-builder-utils';

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
          'group relative flex items-center justify-between h-11 px-3 py-2.5 cursor-pointer w-[225px] rounded-lg transition-all duration-300 ease-in-out',
          // Background animation for operations in progress (with artificial delay)
          showLoadingAnimation && 'bg-muted animate-pulse [animation-duration:1200ms] opacity-30',
          // Selected state
          isCurrentlyLoaded
            ? // TODO: Replace with OpenZeppelin theme colors for selected state
              // Should use semantic token like 'bg-sidebar-item-selected'
              'bg-neutral-100'
            : 'hover:before:content-[""] hover:before:absolute hover:before:inset-x-0 hover:before:top-1 hover:before:bottom-1 hover:before:bg-muted/80 hover:before:rounded-lg hover:before:-z-10'
        )}
      >
        {/* Content */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'font-semibold text-sm truncate',
                // TODO: Replace hard-coded text colors with OpenZeppelin theme
                // Should use semantic tokens like 'text-sidebar-item-selected' and 'text-sidebar-item'
                isCurrentlyLoaded ? 'text-[#111928]' : 'text-gray-600'
              )}
            >
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
