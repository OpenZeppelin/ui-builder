import { ArrowDownToLine } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@openzeppelin/ui-builder-ui';

import { useContractUIStorage } from '../../../contexts/useContractUIStorage';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractUIImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { importContractUIs } = useContractUIStorage();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    // Validate file size (200MB limit to prevent memory issues)
    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds maximum limit of 200MB');
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      await importContractUIs(file);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import configurations');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Contract UIs</DialogTitle>
          <DialogDescription>
            Import a JSON file containing exported Contract UI configurations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">Select file</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".json"
                onChange={(e) => void handleFileChange(e)}
                disabled={isImporting}
                className="cursor-pointer"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span className="sr-only">Select import file</span>
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">File requirements:</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• JSON format (.json extension)</li>
              <li>• Must be a valid Contract UI export</li>
              <li>• Maximum size: 200MB</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
