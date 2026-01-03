import { SidebarButton, SidebarSection } from '@openzeppelin/ui-components';
import { appConfigService } from '@openzeppelin/ui-utils';

import ContractsWizardIconSvg from '../../../assets/icons/contracts-wizard-icon.svg';
import { DevToolsDropdown } from '../../Common/DevToolsDropdown';

/**
 * Other Tools section component for the sidebar
 */
export default function OtherToolsSection() {
  // Check if dev tools should be shown
  const showDevTools = appConfigService.isFeatureEnabled('show_dev_tools');

  return (
    <SidebarSection title="Other Tools">
      <SidebarButton
        icon={<img src={ContractsWizardIconSvg} alt="Contracts Wizard" className="size-4" />}
        href="https://wizard.openzeppelin.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contracts Wizard
      </SidebarButton>

      {/* Dev Tools - Only shown when feature flag is enabled */}
      {showDevTools && (
        <div className="relative">
          <DevToolsDropdown />
        </div>
      )}
    </SidebarSection>
  );
}
