import { FileJson2, FileSearch } from 'lucide-react';

import SidebarButton from './SidebarButton';

/**
 * Other Tools section component for the sidebar
 */
export default function OtherToolsSection() {
  return (
    <div className="flex flex-col w-full">
      <div className="text-[#5e5e5e] text-xs font-semibold leading-4 mb-1">Other Tools</div>
      <div className="flex flex-col">
        <SidebarButton
          icon={<FileJson2 className="h-4 w-4" />}
          onClick={() => window.open('https://wizard.openzeppelin.com/', '_blank')}
        >
          Contract Wizard
        </SidebarButton>

        <SidebarButton icon={<FileSearch className="h-4 w-4" />}>Audit Tool</SidebarButton>
      </div>
    </div>
  );
}
