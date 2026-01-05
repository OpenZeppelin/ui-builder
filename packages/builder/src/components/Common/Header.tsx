import { Header as UIHeader } from '@openzeppelin/ui-components';
import { WalletConnectionHeader } from '@openzeppelin/ui-react';

interface HeaderProps {
  title?: string;
  /** Open the mobile sidebar */
  onOpenSidebar?: () => void;
}

/**
 * Application header component with optional title, navigation, and wallet connection.
 */
export const Header = ({ title, onOpenSidebar }: HeaderProps) => {
  return (
    <UIHeader
      title={title}
      onOpenSidebar={onOpenSidebar}
      rightContent={<WalletConnectionHeader />}
    />
  );
};
