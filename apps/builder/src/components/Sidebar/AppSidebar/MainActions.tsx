import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpenText,
  BookUser,
  LayoutPanelTop,
  SquarePen,
} from 'lucide-react';
import { useState } from 'react';

import { SidebarButton } from '@openzeppelin/ui-components';
import { cn } from '@openzeppelin/ui-utils';

import { useContractUIStorage } from '../../../contexts/useContractUIStorage';
import { useBuilderAnalytics } from '../../../hooks/useBuilderAnalytics';
import { AddressBookDialog } from '../../AddressBook/AddressBookDialog';
import { recordHasMeaningfulContent } from '../../UIBuilder/utils/meaningfulContent';

interface MainActionsProps {
  onCreateNew?: () => void;
  onShowImportDialog: () => void;
  isInNewUIMode?: boolean; // New: indicates if we're in new UI mode
}

/**
 * Main action buttons section for the sidebar
 */
export default function MainActions({
  onCreateNew,
  onShowImportDialog,
  isInNewUIMode = false,
}: MainActionsProps) {
  const { exportContractUIs, contractUIs } = useContractUIStorage();
  const { trackSidebarInteraction } = useBuilderAnalytics();

  const handleExport = async () => {
    // Track sidebar export interaction
    trackSidebarInteraction('export');

    await exportContractUIs(); // Export all configurations
  };

  const handleImport = () => {
    // Track sidebar import interaction
    trackSidebarInteraction('import');

    onShowImportDialog();
  };

  // Check if there are any meaningful (non-draft) records to export
  const hasMeaningfulRecords = contractUIs?.some((record) => {
    return recordHasMeaningfulContent(record);
  });

  const [showAddressBook, setShowAddressBook] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div className={cn(isInNewUIMode && 'bg-neutral-100 rounded-lg')}>
        <SidebarButton
          icon={<SquarePen className="size-4" />}
          onClick={onCreateNew}
          isSelected={isInNewUIMode}
        >
          New Contract UI
        </SidebarButton>
      </div>

      <SidebarButton icon={<LayoutPanelTop className="size-4" />} badge="Coming Soon" disabled>
        Templates
      </SidebarButton>

      <SidebarButton
        icon={<BookUser className="size-4" />}
        onClick={() => setShowAddressBook(true)}
      >
        Address Book
      </SidebarButton>

      <SidebarButton icon={<ArrowDownToLine className="size-4" />} onClick={handleImport}>
        Import
      </SidebarButton>

      {hasMeaningfulRecords && (
        <SidebarButton
          icon={<ArrowUpFromLine className="size-4" />}
          onClick={() => void handleExport()}
        >
          Export
        </SidebarButton>
      )}

      <SidebarButton
        icon={<BookOpenText className="size-4" />}
        href="https://docs.openzeppelin.com/ui-builder"
        target="_blank"
        rel="noopener noreferrer"
      >
        Docs
      </SidebarButton>

      <AddressBookDialog open={showAddressBook} onOpenChange={setShowAddressBook} />
    </div>
  );
}
