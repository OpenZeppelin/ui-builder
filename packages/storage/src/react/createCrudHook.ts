type OnError = (title: string, err: unknown) => void;

export interface CrudRepository<T> {
  save: (record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export function createCrudHook<T>(repo: CrudRepository<T>, opts?: { onError?: OnError }) {
  const onError = opts?.onError;

  const wrap = async <R>(title: string, action: () => Promise<R>): Promise<R> => {
    try {
      return await action();
    } catch (error) {
      onError?.(title, error);
      throw error;
    }
  };

  return function useCrud() {
    return {
      save: (record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) =>
        wrap('Failed to save', () => repo.save(record)),
      update: (id: string, updates: Partial<T>) =>
        wrap('Failed to update', () => repo.update(id, updates)),
      remove: (id: string) => wrap('Failed to delete', () => repo.delete(id)),
      clear: () => wrap('Failed to delete all', () => repo.clear()),
    } as const;
  };
}
