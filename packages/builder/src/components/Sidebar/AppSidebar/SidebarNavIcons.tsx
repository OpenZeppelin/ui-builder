import { SiGithub, SiX } from '@icons-pack/react-simple-icons';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

interface SidebarNavIconsProps {
  className?: string;
}

/**
 * Compact set of navigation icons for external links.
 */
export default function SidebarNavIcons({ className }: SidebarNavIconsProps) {
  return (
    <nav className={cn('flex items-center gap-4 text-primary', className)}>
      <a
        href="https://github.com/OpenZeppelin/ui-builder"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600 transition-colors"
        title="View on GitHub"
      >
        <SiGithub size={20} />
      </a>
      <a
        href="https://x.com/openzeppelin"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600 transition-colors"
        title="Follow on X"
      >
        <SiX size={20} />
      </a>
    </nav>
  );
}
