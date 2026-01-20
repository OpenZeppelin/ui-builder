import { SidebarSection } from '@openzeppelin/ui-components';

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
    <SidebarSection title="Contract UIs" grow>
      <ContractUIsList
        onLoadContractUI={onLoadContractUI}
        onResetAfterDelete={onResetAfterDelete}
        currentLoadedConfigurationId={currentLoadedConfigurationId}
      />
    </SidebarSection>
  );
}
