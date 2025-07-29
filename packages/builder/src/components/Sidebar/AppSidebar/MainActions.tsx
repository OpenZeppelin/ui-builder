import { Download, LayoutPanelTop, SquarePen, Upload } from 'lucide-react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { recordHasMeaningfulContent } from '../../ContractsUIBuilder/utils/recordUtils';

import SidebarButton from './SidebarButton';

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

  const handleDownload = async () => {
    await exportContractUIs(); // Export all configurations
  };

  // Check if there are any meaningful (non-draft) records to export
  const hasMeaningfulRecords = contractUIs?.some((record) => {
    return recordHasMeaningfulContent(record);
  });

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          // Show selection styling when in new UI mode
          isInNewUIMode && 'bg-neutral-100 rounded-lg'
        )}
      >
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

      <SidebarButton icon={<Upload className="size-4" />} onClick={onShowImportDialog}>
        Upload
      </SidebarButton>

      {hasMeaningfulRecords && (
        <SidebarButton icon={<Download className="size-4" />} onClick={() => void handleDownload()}>
          Download
        </SidebarButton>
      )}
    </div>
  );
}
