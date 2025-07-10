import { createContext } from 'react';

import type { NetworkErrorContextValue } from './useNetworkErrors';

export const NetworkErrorContext = createContext<NetworkErrorContextValue | undefined>(undefined);
