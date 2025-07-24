import { LayoutPanelTop, SquarePen, Upload } from 'lucide-react';

import SidebarButton from './SidebarButton';

interface MainActionsProps {
  onCreateNew?: () => void;
  onShowImportDialog: () => void;
}

/**
 * Main action buttons section for the sidebar
 */
export default function MainActions({ onCreateNew, onShowImportDialog }: MainActionsProps) {
  return (
    <div className="flex flex-col w-full">
      <SidebarButton icon={<SquarePen className="h-4 w-4" />} onClick={onCreateNew}>
        New Contract UI
      </SidebarButton>

      <SidebarButton icon={<LayoutPanelTop className="h-4 w-4" />}>Templates</SidebarButton>

      <SidebarButton icon={<Upload className="h-4 w-4" />} onClick={onShowImportDialog}>
        Upload
      </SidebarButton>
    </div>
  );
}
