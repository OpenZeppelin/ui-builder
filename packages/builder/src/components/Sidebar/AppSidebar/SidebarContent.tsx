import ContractUIsSection from './ContractUIsSection';
import MainActions from './MainActions';
import OtherToolsSection from './OtherToolsSection';

interface SidebarContentProps {
  onCreateNew?: () => void;
  onShowImportDialog: () => void;
  isInNewUIMode: boolean;
  onLoadContractUI: (id: string) => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
  gapClass?: string;
}

/**
 * Shared scrollable content for the app sidebar (desktop and mobile).
 */
export default function SidebarContent({
  onCreateNew,
  onShowImportDialog,
  isInNewUIMode,
  onLoadContractUI,
  onResetAfterDelete,
  currentLoadedConfigurationId,
  gapClass = 'gap-12',
}: SidebarContentProps) {
  return (
    <div className={`flex flex-col w-full ${gapClass}`}>
      <MainActions
        onCreateNew={onCreateNew}
        onShowImportDialog={onShowImportDialog}
        isInNewUIMode={isInNewUIMode}
      />

      <OtherToolsSection />

      <ContractUIsSection
        onLoadContractUI={onLoadContractUI}
        onResetAfterDelete={onResetAfterDelete}
        currentLoadedConfigurationId={currentLoadedConfigurationId}
      />
    </div>
  );
}
