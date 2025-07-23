import { Copy, Download, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { ContractUIRecord } from '@openzeppelin/contracts-ui-builder-storage';
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  LoadingButton,
} from '@openzeppelin/contracts-ui-builder-ui';

import ContractUIDeleteDialog from './ContractUIDeleteDialog';
import ContractUIRenameDialog from './ContractUIRenameDialog';

// Simple relative time formatter
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

interface ContractUIItemProps {
  contractUI: ContractUIRecord;
  isSelected: boolean;
  isCurrentlyLoaded?: boolean;
  onToggleSelect: (id: string) => void;
  onLoad: () => void;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<string>;
  onRename: (newTitle: string) => Promise<void>;
  onExport: () => Promise<void>;
}

export default function ContractUIItem({
  contractUI,
  isSelected,
  isCurrentlyLoaded = false,
  onToggleSelect,
  onLoad,
  onDelete,
  onDuplicate,
  onRename,
  onExport,
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

  const ecosystemLabel =
    contractUI.ecosystem.charAt(0).toUpperCase() + contractUI.ecosystem.slice(1);

  return (
    <>
      <div
        onClick={onLoad}
        className={`group relative flex items-start gap-2 border-b p-3 hover:bg-muted/50 cursor-pointer ${
          isCurrentlyLoaded ? 'bg-primary/5' : ''
        }`}
      >
        {/* Checkbox */}
        <div
          className="pt-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(contractUI.id);
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(contractUI.id)}
            aria-label="Select item"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3
            className={`font-medium truncate ${isCurrentlyLoaded ? 'text-primary' : 'group-hover:text-primary'}`}
          >
            {contractUI.title}
          </h3>
          <div className="mt-1 text-xs text-muted-foreground">
            <p className="truncate">
              {ecosystemLabel} • {contractUI.contractAddress}
            </p>
            <p className="mt-0.5">Updated {formatRelativeTime(contractUI.updatedAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <LoadingButton size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </LoadingButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onDuplicate()}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onExport()}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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
