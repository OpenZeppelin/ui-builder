import { describe, expect, it } from 'vitest';

import { TemplateProcessor } from '../../export/generators/TemplateProcessor';

// Mock template files for TemplateProcessor
const mockTemplateFiles = {
  'template.json': async () => Promise.resolve('{ "key": "value" }'),
};

describe('JSON Formatting', () => {
  const processor = new TemplateProcessor(mockTemplateFiles);

  it('should format simple JSON correctly', async () => {
    const jsonString = '{"name":"simple-package","version":"1.0.0"}';
    const formattedJson = await processor.formatJson(jsonString);

    // Expect standard 2-space indentation and ONE trailing newline
    expect(formattedJson).toBe(
      `{\n  "name": "simple-package",\n  "version": "1.0.0"\n}\n` // Expect ONE trailing newline
    );
  });

  it('should format complex JSON correctly', async () => {
    const complexJson = {
      name: 'complex-package',
      nested: { prop1: 'value1', prop2: { subprop: 'subvalue' } },
      array: [1, 2, 3, { item: 'value' }],
    };
    const jsonString = JSON.stringify(complexJson);
    const formattedJson = await processor.formatJson(jsonString);

    // Verify correct formatting with 2-space indent and ONE trailing newline
    const expectedFormattedJson = `{
  "name": "complex-package",
  "nested": {
    "prop1": "value1",
    "prop2": {
      "subprop": "subvalue"
    }
  },
  "array": [
    1,
    2,
    3,
    {
      "item": "value"
    }
  ]
}\n`; // Expect ONE trailing newline
    expect(formattedJson).toBe(expectedFormattedJson);
  });

  it('should handle invalid JSON input', async () => {
    const invalidJsonString = '{"name":"incomplete",';
    // Expect formatJson to return the original string if formatting fails
    const result = await processor.formatJson(invalidJsonString);
    expect(result).toBe(invalidJsonString);
  });
});
