import React, { useContext } from 'react';

import { MidnightWalletContext } from '../context/MidnightWalletContext';

/**
 * A wrapper component that safely renders children that use Midnight hooks.
 * It checks if the MidnightWalletContext is available and renders a fallback
 * if it's not, preventing crashes when switching adapters.
 */
export const SafeMidnightComponent = ({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const context = useContext(MidnightWalletContext);

  // If the context is not available, it means the MidnightWalletUiRoot
  // is not in the tree. Render the fallback to prevent a crash.
  if (!context) {
    return <>{fallback}</>;
  }

  // If the context is available, render the actual component.
  return <>{children}</>;
};
