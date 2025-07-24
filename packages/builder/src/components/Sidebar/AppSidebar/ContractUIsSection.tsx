import ContractUIsList from '../ContractUIs/ContractUIsList';

interface ContractUIsSectionProps {
  onLoadContractUI?: (id: string) => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Contract UIs section component for the sidebar
 */
export default function ContractUIsSection({
  onLoadContractUI,
  currentLoadedConfigurationId,
}: ContractUIsSectionProps) {
  return (
    <div className="flex flex-col w-full flex-1">
      <div className="text-[#5e5e5e] text-xs font-semibold leading-4 mb-1">Contract UIs</div>
      <div className="flex-1 overflow-hidden">
        <ContractUIsList
          onLoadContractUI={onLoadContractUI}
          currentLoadedConfigurationId={currentLoadedConfigurationId}
        />
      </div>
    </div>
  );
}
