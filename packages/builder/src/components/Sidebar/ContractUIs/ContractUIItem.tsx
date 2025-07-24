import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

import type { ContractUIRecord } from '@openzeppelin/contracts-ui-builder-storage';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@openzeppelin/contracts-ui-builder-ui';

import ContractUIDeleteDialog from './ContractUIDeleteDialog';
import ContractUIRenameDialog from './ContractUIRenameDialog';

interface ContractUIItemProps {
  contractUI: ContractUIRecord;
  isCurrentlyLoaded?: boolean;
  onLoad: () => void;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onRename: (newTitle: string) => Promise<void>;
}

export default function ContractUIItem({
  contractUI,
  isCurrentlyLoaded = false,
  onLoad,
  onDelete,
  onDuplicate,
  onRename,
}: ContractUIItemProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        className={`group relative flex items-center justify-between h-11 px-3 py-2.5 rounded-lg cursor-pointer w-[225px] ${
          isCurrentlyLoaded ? 'bg-neutral-100' : 'hover:bg-muted/80'
        }`}
      >
        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3
            className={`font-semibold text-sm truncate ${
              isCurrentlyLoaded ? 'text-[#111928]' : 'text-gray-600'
            }`}
          >
            {contractUI.title}
          </h3>
        </div>

        {/* Actions */}
        <div className="shrink-0 self-stretch" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-full w-5 p-0 transition-opacity ${
                  isCurrentlyLoaded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onDuplicate()}>Duplicate</DropdownMenuItem>
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
