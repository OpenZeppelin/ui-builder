import { Download } from 'lucide-react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { Button } from '@openzeppelin/contracts-ui-builder-ui';

import ContractUIsList from '../ContractUIs/ContractUIsList';

interface ContractUIsSectionProps {
  onLoadContractUI?: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Contract UIs section component for the sidebar
 */
export default function ContractUIsSection({
  onLoadContractUI,
  onResetAfterDelete,
  currentLoadedConfigurationId,
}: ContractUIsSectionProps) {
  const { exportContractUIs, contractUIs } = useContractUIStorage();

  const handleExportAll = async () => {
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
    <div className="flex flex-col w-full flex-1">
      {/* Section Header with Export All Button */}
      <div className="flex items-center justify-between mb-1">
        {/* TODO: Replace hard-coded text color with OpenZeppelin theme */}
        {/* Should use semantic token like 'text-sidebar-section-header' */}
        <div className="text-[#5e5e5e] text-xs font-semibold leading-4">Contract UIs</div>
        {hasMeaningfulRecords && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleExportAll()}
            className="h-6 px-2 text-xs hover:bg-muted/50"
            title="Export all Contract UIs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export All
          </Button>
        )}
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-hidden">
        <ContractUIsList
          onLoadContractUI={onLoadContractUI}
          onResetAfterDelete={onResetAfterDelete}
          currentLoadedConfigurationId={currentLoadedConfigurationId}
        />
      </div>
    </div>
  );
}
