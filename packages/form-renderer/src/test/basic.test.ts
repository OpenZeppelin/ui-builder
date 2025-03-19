import { describe, expect, it } from 'vitest';

import { TransactionFormRenderer } from '../components';

describe('Form Renderer', () => {
  it('exports TransactionFormRenderer component', () => {
    expect(TransactionFormRenderer).toBeDefined();
    // Check that it's a function (React component)
    expect(typeof TransactionFormRenderer).toBe('function');
  });
});
