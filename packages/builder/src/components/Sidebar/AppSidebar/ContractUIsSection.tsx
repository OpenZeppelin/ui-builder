import { useContractUIStorage } from '../../../contexts/useContractUIStorage';
import ContractUIsList from '../ContractUIs/ContractUIsList';

interface ContractUIsSectionProps {
  onLoadContractUI?: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Contract UIs section component for the sidebar
 *
 * This component conditionally renders based on whether any contract UIs exist.
 * When no contract UIs are saved, the entire section is hidden to keep the sidebar clean.
 */
export default function ContractUIsSection({
  onLoadContractUI,
  onResetAfterDelete,
  currentLoadedConfigurationId,
}: ContractUIsSectionProps) {
  const { contractUIs, isLoading } = useContractUIStorage();

  // Hide the entire section if there are no contract UIs and we're not loading
  if (!isLoading && (!contractUIs || contractUIs.length === 0)) {
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
