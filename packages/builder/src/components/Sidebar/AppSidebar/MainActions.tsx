import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpenText,
  LayoutPanelTop,
  SquarePen,
} from 'lucide-react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { useContractUIStorage } from '../../../contexts/useContractUIStorage';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { recordHasMeaningfulContent } from '../../UIBuilder/utils/recordUtils';
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
  const { trackSidebarInteraction } = useAnalytics();

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

      {/* Docs link below Import/Export */}
      <SidebarButton
        icon={<BookOpenText className="size-4" />}
        href="https://docs.openzeppelin.com/contracts-ui-builder"
        target="_blank"
        rel="noopener noreferrer"
      >
        Docs
      </SidebarButton>
    </div>
  );
}
