import { appConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import ContractsWizardIconSvg from '../../../assets/icons/contracts-wizard-icon.svg';
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
          icon={<img src={ContractsWizardIconSvg} alt="Contract Wizard" className="size-4" />}
          href="https://wizard.openzeppelin.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contract Wizard
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
