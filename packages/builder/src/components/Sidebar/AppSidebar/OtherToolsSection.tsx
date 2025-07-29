import { FileJson2, FileSearch } from 'lucide-react';

import { appConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import { DevToolsDropdown } from '../../Common/DevToolsDropdown';

import SidebarButton from './SidebarButton';

/**
 * Other Tools section component for the sidebar
 */
export default function OtherToolsSection() {
  // Check if dev tools should be shown
  const showDevTools = appConfigService.isFeatureEnabled('show_dev_tools');

  return (
    <div className="flex flex-col w-full">
      {/* TODO: Replace hard-coded text color with OpenZeppelin theme */}
      {/* Should use semantic token like 'text-sidebar-section-header' */}
      <div className="text-[#5e5e5e] text-xs font-semibold leading-4 mb-1">Other Tools</div>
      <div className="flex flex-col">
        <SidebarButton
          icon={<FileJson2 className="size-4" />}
          onClick={() => window.open('https://wizard.openzeppelin.com/', '_blank')}
        >
          Contract Wizard
        </SidebarButton>

        <SidebarButton icon={<FileSearch className="size-4" />} badge="Coming Soon" disabled>
          Audit Tool
        </SidebarButton>

        {/* Dev Tools - Only shown when feature flag is enabled */}
        {showDevTools && (
          <div className="relative">
            <DevToolsDropdown />
          </div>
        )}
      </div>
    </div>
  );
}
