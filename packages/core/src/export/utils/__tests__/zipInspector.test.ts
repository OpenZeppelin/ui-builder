import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import logger
import {
  extractFilesFromZip,
  validateExportedProject,
  type ZipExtractionTestCallback,
} from '../zipInspector';

// Helper to create a test ZIP blob
async function createTestZip(files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();

  // Add files to the ZIP
  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content);
  });

  // Create a directory
  zip.folder('empty-dir');

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

// Store original method implementation directly
let originalAsyncImpl:
  | ((type: JSZip.OutputType) => Promise<JSZip.OutputByType[JSZip.OutputType]>)
  | undefined;

beforeEach(() => {
  // Capture the original implementation from the prototype
  originalAsyncImpl = JSZip.prototype.async;
});

afterEach(() => {
  // Restore the original implementation to the prototype
  if (originalAsyncImpl) {
    JSZip.prototype.async = originalAsyncImpl;
  }
  vi.restoreAllMocks();
});

describe('zipInspector', () => {
  describe('extractFilesFromZip', () => {
    it('should extract text files from a ZIP blob', async () => {
      // Create test files
      const testFiles = {
        'file1.txt': 'Content of file 1',
        'src/file2.js': 'console.log("Hello world");',
        'package.json': '{"name":"test","version":"1.0.0"}',
      };

      // Create a test ZIP blob
      const zipBlob = await createTestZip(testFiles);

      // Extract files from the ZIP
      const extractedFiles = await extractFilesFromZip(zipBlob);

      // Verify all files were extracted correctly
      expect(Object.keys(extractedFiles).length).toBe(3);
      expect(extractedFiles['file1.txt']).toBe(testFiles['file1.txt']);
      expect(extractedFiles['src/file2.js']).toBe(testFiles['src/file2.js']);
      expect(extractedFiles['package.json']).toBe(testFiles['package.json']);
    });

    it('should handle binary files gracefully', async () => {
      // Mock a binary file
      const zip = new JSZip();
      zip.file('image.png', 'pretend binary data', { binary: true });
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Extract files from the ZIP
      const extractedFiles = await extractFilesFromZip(zipBlob);

      // Verify binary file was handled correctly
      expect(extractedFiles['image.png']).toBe('pretend binary data');
    });

    it('should handle extraction errors gracefully', async () => {
      // Create a test ZIP with one file that will cause an error
      const zip = new JSZip();
      zip.file('good.txt', 'good content');
      zip.file('bad.txt', 'bad content');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Define a test callback to simulate an error for a specific file
      const testErrorCallback: ZipExtractionTestCallback = (filePath: string /*, fileObject */) => {
        if (filePath === 'bad.txt') {
          throw new Error('Simulated extraction error via callback');
        }
      };

      // Call extractFilesFromZip with the test callback
      const extractedFiles = await extractFilesFromZip(zipBlob, testErrorCallback);

      // Verify error handling: Expect the good file and an error message for the bad file
      expect(extractedFiles).toHaveProperty('good.txt', 'good content');
      expect(extractedFiles['bad.txt']).toContain(
        'ERROR_EXTRACTING: Simulated extraction error via callback'
      );
    });

    it('should skip directory entries', async () => {
      // Create a test ZIP with a directory
      const zip = new JSZip();
      zip.file('file.txt', 'content');
      zip.folder('dir');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Extract files from the ZIP
      const extractedFiles = await extractFilesFromZip(zipBlob);

      // Verify only the file was extracted
      expect(Object.keys(extractedFiles).length).toBe(1);
      expect(extractedFiles['file.txt']).toBe('content');
      expect(extractedFiles['dir/']).toBeUndefined();
    });
  });

  describe('validateExportedProject', () => {
    it('should validate required files correctly', () => {
      const files = {
        'file1.txt': 'content',
        'file2.txt': 'content',
        'src/file3.js': 'content',
      };

      // All required files exist
      let result = validateExportedProject(files, {
        requiredFiles: ['file1.txt', 'file2.txt'],
      });
      expect(result.isValid).toBe(true);

      // Missing required file
      result = validateExportedProject(files, {
        requiredFiles: ['file1.txt', 'missing.txt'],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required file: missing.txt');
    });

    it('should validate forbidden files correctly', () => {
      const files = {
        'file1.txt': 'content',
        'file2.txt': 'content',
      };

      // No forbidden files exist
      let result = validateExportedProject(files, {
        forbiddenFiles: ['forbidden.txt'],
      });
      expect(result.isValid).toBe(true);

      // Forbidden file exists
      result = validateExportedProject(files, {
        forbiddenFiles: ['file1.txt'],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Found forbidden file: file1.txt');
    });

    it('should validate content correctly', () => {
      const files = {
        'config.json': '{"name":"test","version":"1.0.0"}',
        'app.js': 'import React from "react";',
      };

      // Content validation passes
      let result = validateExportedProject(files, {
        contentValidations: {
          'config.json': (content) => content.includes('test'),
        },
      });
      expect(result.isValid).toBe(true);

      // Content validation fails
      result = validateExportedProject(files, {
        contentValidations: {
          'config.json': (content) =>
            content.includes('wrong') || 'Expected "wrong" in config.json',
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expected "wrong" in config.json');

      // Content validation on missing file
      result = validateExportedProject(files, {
        contentValidations: {
          'missing.txt': () => true,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot validate missing file: missing.txt');
    });

    it('should validate regex patterns correctly', () => {
      const files = {
        'app.js': 'import React from "react";',
        'index.html': '<!DOCTYPE html><html><body>Hello</body></html>',
      };

      // Pattern matches
      let result = validateExportedProject(files, {
        contentPatterns: {
          'app.js': /import React/,
        },
      });
      expect(result.isValid).toBe(true);

      // Pattern doesn't match
      result = validateExportedProject(files, {
        contentPatterns: {
          'app.js': /import Vue/,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Pattern match failed for app.js');
    });

    it('should combine multiple validation types correctly', () => {
      const files = {
        'package.json': '{"name":"test","dependencies":{"react":"18.0.0"}}',
        'app.js': 'import React from "react";',
        'README.md': '# Test Project',
      };

      // All validations pass
      const result = validateExportedProject(files, {
        requiredFiles: ['package.json', 'app.js'],
        forbiddenFiles: ['forbidden.txt'],
        contentValidations: {
          'package.json': (content) =>
            JSON.parse(content).dependencies.react ? true : 'React dependency not found',
        },
        contentPatterns: {
          'app.js': /import React/,
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.successes.length).toBe(5); // 2 required files + 1 forbidden file + 1 content validation + 1 pattern match
    });
  });
});
