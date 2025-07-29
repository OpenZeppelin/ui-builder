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
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
  isInNewUIMode?: boolean;
}

/**
 * Main application sidebar component with logo, actions, and saved Contract UIs
 */
export default function AppSidebar({
  className,
  onLoadContractUI,
  onCreateNew,
  onResetAfterDelete,
  currentLoadedConfigurationId,
  isInNewUIMode = false,
}: AppSidebarProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          // TODO: Replace hard-coded sidebar background with OpenZeppelin theme
          // Should use semantic token like 'bg-sidebar-background'
          'fixed left-0 top-0 z-40 h-full w-[289px] bg-[rgba(245,245,245,0.31)] flex flex-col',
          className
        )}
      >
        {/* Fixed Header - Logo */}
        <div className="flex-shrink-0 px-8 pt-12">
          <SidebarLogo />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-12">
          <div className="flex flex-col gap-12 w-full">
            <MainActions
              onCreateNew={onCreateNew}
              onShowImportDialog={() => setShowImportDialog(true)}
              isInNewUIMode={isInNewUIMode}
            />

            <OtherToolsSection />

            <ContractUIsSection
              onLoadContractUI={onLoadContractUI}
              onResetAfterDelete={onResetAfterDelete}
              currentLoadedConfigurationId={currentLoadedConfigurationId}
            />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Spacer to push content */}
      <div className="w-[289px]" />
    </>
  );
}
