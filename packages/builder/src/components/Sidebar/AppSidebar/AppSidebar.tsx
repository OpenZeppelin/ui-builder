import { useState } from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

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
 * Main application sidebar component with logo, actions, and saved Contract UIs
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

  /** Shared sidebar scrollable content wrapper */
  const SidebarBody = ({
    paddingClass,
    gapClass = 'gap-12',
    onLoadContractUiHandler,
  }: {
    paddingClass: string;
    gapClass?: string;
    onLoadContractUiHandler: (id: string) => void;
  }) => (
    <div className={cn('flex-1 overflow-y-auto', paddingClass)}>
      <SidebarContent
        onCreateNew={onCreateNew}
        onShowImportDialog={() => setShowImportDialog(true)}
        isInNewUIMode={isInNewUIMode}
        onLoadContractUI={onLoadContractUiHandler}
        onResetAfterDelete={onResetAfterDelete}
        currentLoadedConfigurationId={currentLoadedConfigurationId}
        gapClass={gapClass}
      />
    </div>
  );

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          // TODO: Replace hard-coded sidebar background with OpenZeppelin theme
          // Should use semantic token like 'bg-sidebar-background'
          'fixed left-0 top-0 z-40 h-full w-[289px] bg-[rgba(245,245,245,0.31)] hidden xl:flex xl:flex-col',
          className
        )}
      >
        {/* Fixed Header - Logo */}
        <div className="flex-shrink-0 px-8 pt-12">
          <SidebarLogo />
        </div>

        {/* Scrollable Content Area */}
        <SidebarBody
          paddingClass="px-8 pb-24"
          onLoadContractUiHandler={(id) => onLoadContractUI?.(id)}
        />

        {/* Fixed footer icons */}
        <div className="pointer-events-auto sticky bottom-0 px-8 py-4">
          <SidebarNavIcons />
        </div>
      </div>

      {/* Import Dialog */}
      <ContractUIImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Spacer to push content (desktop only) */}
      <div className="hidden xl:block w-[289px]" />

      {/* Mobile slide-over */}
      {typeof open === 'boolean' && onOpenChange && (
        <div
          className={cn(
            'xl:hidden fixed inset-0 z-50',
            open ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity',
              open ? 'opacity-100' : 'opacity-0'
            )}
            onClick={() => onOpenChange(false)}
          />
          {/* Panel */}
          <div
            className={cn(
              'absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-[rgba(245,245,245,0.98)] shadow-xl transition-transform',
              open ? 'translate-x-0' : '-translate-x-full'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-full flex-col">
              <div className="flex-shrink-0 px-6 pt-10 pb-4">
                <SidebarLogo />
              </div>
              <SidebarBody
                paddingClass="px-6 pb-20"
                gapClass="gap-10"
                onLoadContractUiHandler={(id) => {
                  onOpenChange(false);
                  onLoadContractUI?.(id);
                }}
              />
              {/* Mobile fixed footer icons */}
              <div className="px-6 py-4">
                <SidebarNavIcons />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
