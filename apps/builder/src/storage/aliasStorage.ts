import { toast } from 'sonner';

import { createUseAliasStorage } from '@openzeppelin/ui-storage';

import { db } from './database';

/**
 * Pre-configured alias storage hook for the UI Builder app.
 * Provides CRUD operations for address aliases with toast error handling.
 */
export const useAliasStorage = createUseAliasStorage(db, {
  onError: (title, error) => {
    const message = error instanceof Error ? error.message : String(error);
    toast.error(`${title}: ${message}`);
  },
});
