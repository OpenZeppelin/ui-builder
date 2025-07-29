import { ContractUIRecord, useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';

import { recordHasMeaningfulContent } from '../../ContractsUIBuilder/utils/recordUtils';
import ContractUIsList from '../ContractUIs/ContractUIsList';

interface ContractUIsSectionProps {
  onLoadContractUI?: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Filters records to only show those with meaningful content or that are manually renamed.
 */
function shouldShowRecord(
  record: ContractUIRecord,
  currentLoadedConfigurationId: string | null
): boolean {
  // Always show the currently loaded record, even if it's empty
  if (currentLoadedConfigurationId === record.id) {
    return true;
  }

  return recordHasMeaningfulContent(record);
}

/**
 * Contract UIs section component for the sidebar
 */
export default function ContractUIsSection({
  onLoadContractUI,
  onResetAfterDelete,
  currentLoadedConfigurationId,
}: ContractUIsSectionProps) {
  const { contractUIs } = useContractUIStorage();

  // Check if there are any visible contract UIs
  const visibleContractUIs =
    contractUIs?.filter((contractUI) =>
      shouldShowRecord(contractUI, currentLoadedConfigurationId ?? null)
    ) || [];

  // Don't render the section at all if there are no visible contract UIs
  if (visibleContractUIs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col w-full flex-1">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1">
        {/* TODO: Replace hard-coded text color with OpenZeppelin theme */}
        {/* Should use semantic token like 'text-sidebar-section-header' */}
        <div className="text-[#5e5e5e] text-xs font-semibold leading-4">Contract UIs</div>
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
