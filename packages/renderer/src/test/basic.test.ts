import { describe, expect, it } from 'vitest';

import { TransactionForm } from '../components';

describe('Form Renderer', () => {
  it('exports TransactionForm component', () => {
    expect(TransactionForm).toBeDefined();
    // Check that it's a function (React component)
    expect(typeof TransactionForm).toBe('function');
  });
});
