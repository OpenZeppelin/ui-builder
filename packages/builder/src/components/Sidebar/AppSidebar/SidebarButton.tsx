import { ReactNode } from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';

interface SidebarButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  size?: 'default' | 'small';
}

/**
 * Shared button component for sidebar actions with consistent styling
 */
export default function SidebarButton({
  icon,
  children,
  onClick,
  size = 'default',
}: SidebarButtonProps) {
  const height = size === 'small' ? 'h-10' : 'h-11';

  return (
    <Button
      variant="ghost"
      className={`flex items-center justify-start gap-2 ${height} px-3 py-2.5 rounded-lg text-gray-600 hover:text-gray-700 font-semibold text-sm`}
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}
