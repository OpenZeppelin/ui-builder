import { useState } from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import ContractUIImportDialog from '../ContractUIs/ContractUIImportDialog';

import ContractUIsSection from './ContractUIsSection';
import MainActions from './MainActions';
import OtherToolsSection from './OtherToolsSection';
import SidebarLogo from './SidebarLogo';

interface AppSidebarProps {
  className?: string;
  onLoadContractUI?: (id: string) => void;
  onCreateNew?: () => void;
  currentLoadedConfigurationId?: string | null;
}

/**
 * Main application sidebar component with logo, actions, and saved Contract UIs
 */
export default function AppSidebar({
  className,
  onLoadContractUI,
  onCreateNew,
  currentLoadedConfigurationId,
}: AppSidebarProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-[289px] bg-[rgba(245,245,245,0.31)] flex flex-col px-8 py-12',
          className
        )}
      >
        <SidebarLogo />

        <div className="flex flex-col gap-12 w-full">
          <MainActions
            onCreateNew={onCreateNew}
            onShowImportDialog={() => setShowImportDialog(true)}
          />

          <OtherToolsSection />

          <ContractUIsSection
            onLoadContractUI={onLoadContractUI}
            currentLoadedConfigurationId={currentLoadedConfigurationId}
          />
        </div>
      </div>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Spacer to push content */}
      <div className="w-[289px]" />
    </>
  );
}
