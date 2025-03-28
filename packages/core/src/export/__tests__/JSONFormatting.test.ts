import { describe, expect, it } from 'vitest';

import { TemplateProcessor } from '../generators/TemplateProcessor';

describe('JSON Formatting', () => {
  it('should correctly format JSON', async () => {
    const templateProcessor = new TemplateProcessor({});

    // Test with a sample JSON
    const unformattedJson = `{"name":"test-package","version":"1.0.0","private":true,"dependencies":{"react":"^19.0.0","react-dom":"^19.0.0"},"scripts":{"test":"echo \\"Error: no test specified\\" && exit 1"}}`;

    const formattedJson = await templateProcessor.formatJson(unformattedJson);

    // Verify formatting
    expect(formattedJson).toContain('{\n');
    expect(formattedJson).toContain('  "name":');
    expect(formattedJson).toContain('  "dependencies":');

    // Should use consistent indentation
    const lines = formattedJson.split('\n');
    const indentedLines = lines.filter((line) => line.startsWith('  "'));
    expect(indentedLines.length).toBeGreaterThan(0);

    // Log the formatted JSON for inspection
    console.log('Formatted JSON:');
    console.log(formattedJson);
  });

  it('should format complex JSON correctly', async () => {
    const templateProcessor = new TemplateProcessor({});

    // Test with a nested JSON structure
    const complexJson = `{"name":"complex-package","nested":{"prop1":"value1","prop2":{"subprop":"subvalue"}},"array":[1,2,3,{"item":"value"}]}`;

    const formattedJson = await templateProcessor.formatJson(complexJson);

    // Verify correct formatting of nested structures
    expect(formattedJson).toContain('  "nested":');
    expect(formattedJson).toContain('    "prop1":');
    expect(formattedJson).toContain('    "prop2":');
    expect(formattedJson).toContain('      "subprop":');

    // Array formatting
    expect(formattedJson).toContain('  "array":');
    expect(formattedJson).toContain('    1,');

    // Log the formatted complex JSON
    console.log('Formatted Complex JSON:');
    console.log(formattedJson);
  });
});
