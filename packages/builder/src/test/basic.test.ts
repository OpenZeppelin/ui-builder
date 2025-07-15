import { describe, expect, it } from 'vitest';

import { FormSchemaFactory } from '../core/factories/FormSchemaFactory';

describe('Builder package', () => {
  it('exports FormSchemaFactory', () => {
    expect(FormSchemaFactory).toBeDefined();
    // Check that it's a class constructor
    expect(typeof FormSchemaFactory).toBe('function');
    expect(new FormSchemaFactory()).toBeInstanceOf(FormSchemaFactory);
  });
});
