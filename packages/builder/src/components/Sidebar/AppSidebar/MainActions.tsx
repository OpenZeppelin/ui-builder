import { Download, LayoutPanelTop, SquarePen, Upload } from 'lucide-react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';

import SidebarButton from './SidebarButton';

interface MainActionsProps {
  onCreateNew?: () => void;
  onShowImportDialog: () => void;
}

/**
 * Main action buttons section for the sidebar
 */
export default function MainActions({ onCreateNew, onShowImportDialog }: MainActionsProps) {
  const { exportContractUIs, contractUIs } = useContractUIStorage();

  const handleDownload = async () => {
    await exportContractUIs(); // Export all configurations
  };

  // Check if there are any meaningful (non-draft) records to export
  const hasMeaningfulRecords = contractUIs?.some((record) => {
    // Check if record is meaningful (same logic as in ContractUIItem)
    if (record.metadata?.isManuallyRenamed === true) {
      return true;
    }

    const hasContent =
      Boolean(record.contractAddress) ||
      Boolean(record.functionId) ||
      Boolean(record.formConfig.fields && record.formConfig.fields.length > 0);

    return hasContent;
  });

  return (
    <div className="flex flex-col w-full">
      <SidebarButton icon={<SquarePen className="h-4 w-4" />} onClick={onCreateNew}>
        New Contract UI
      </SidebarButton>

      <SidebarButton icon={<LayoutPanelTop className="h-4 w-4" />}>Templates</SidebarButton>

      <SidebarButton icon={<Upload className="h-4 w-4" />} onClick={onShowImportDialog}>
        Upload
      </SidebarButton>

      {hasMeaningfulRecords && (
        <SidebarButton
          icon={<Download className="h-4 w-4" />}
          onClick={() => void handleDownload()}
        >
          Download
        </SidebarButton>
      )}
    </div>
  );
}
