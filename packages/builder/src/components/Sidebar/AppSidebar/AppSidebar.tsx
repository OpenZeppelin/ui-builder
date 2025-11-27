import { useState } from 'react';

import { SidebarLayout } from '@openzeppelin/ui-builder-ui';

import ContractUIImportDialog from '../ContractUIs/ContractUIImportDialog';
import SidebarContent from './SidebarContent';
import SidebarLogo from './SidebarLogo';
import SidebarNavIcons from './SidebarNavIcons';

interface AppSidebarProps {
  className?: string;
  onLoadContractUI?: (id: string) => void;
  onCreateNew?: () => void;
  onResetAfterDelete?: () => void;
  currentLoadedConfigurationId?: string | null;
  isInNewUIMode?: boolean;
  /** Controls visibility in mobile slide-over */
  open?: boolean;
  /** Close handler for mobile slide-over */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Main application sidebar component with logo, actions, and saved Contract UIs.
 * Uses the generic SidebarLayout from @openzeppelin/ui-builder-ui.
 */
export default function AppSidebar({
  className,
  onLoadContractUI,
  onCreateNew,
  onResetAfterDelete,
  currentLoadedConfigurationId,
  isInNewUIMode = false,
  open,
  onOpenChange,
}: AppSidebarProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleLoadContractUI = (id: string) => {
    // Close mobile sidebar when loading a contract UI
    if (onOpenChange) {
      onOpenChange(false);
    }
    onLoadContractUI?.(id);
  };

  return (
    <>
      <SidebarLayout
        className={className}
        header={<SidebarLogo />}
        footer={<SidebarNavIcons />}
        mobileOpen={open}
        onMobileOpenChange={onOpenChange}
      >
        <SidebarContent
          onCreateNew={onCreateNew}
          onShowImportDialog={() => setShowImportDialog(true)}
          isInNewUIMode={isInNewUIMode}
          onLoadContractUI={handleLoadContractUI}
          onResetAfterDelete={onResetAfterDelete}
          currentLoadedConfigurationId={currentLoadedConfigurationId}
        />
      </SidebarLayout>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </>
  );
}
