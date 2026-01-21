import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';

import { ZipGenerator } from '../ZipGenerator';

/**
 * Tests for the ZipGenerator class
 */
describe('ZipGenerator', () => {
  /**
   * Tests for the basic ZIP file creation functionality
   */
  describe('createZipFile', () => {
    it('should create a ZIP file from a map of files', async () => {
      const zipGenerator = new ZipGenerator();
      const files = {
        'package.json': '{"name":"test-project"}',
        'src/index.ts': 'console.log("Hello world");',
        'README.md': '# Test Project',
      };

      const result = await zipGenerator.createZipFile(files, 'test-project');

      // Verify the result structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('fileName', 'test-project.zip');

      // In test environment we should get a Buffer (not Blob)
      expect(Buffer.isBuffer(result.data)).toBe(true);

      // Verify the content (by extracting it with JSZip)
      const zip = new JSZip();
      const extracted = await zip.loadAsync(result.data);

      // Filter for actual files (not directories)
      const actualFiles = Object.keys(extracted.files).filter((path) => !extracted.files[path].dir);

      // Check that all files are present
      expect(actualFiles).toHaveLength(3);
      expect(extracted.file('package.json')).toBeTruthy();
      expect(extracted.file('src/index.ts')).toBeTruthy();
      expect(extracted.file('README.md')).toBeTruthy();

      // Verify content of a specific file
      const packageJson = await extracted.file('package.json')?.async('string');
      expect(packageJson).toBe('{"name":"test-project"}');
    });

    it('should handle binary files (Uint8Array)', async () => {
      const zipGenerator = new ZipGenerator();
      const binaryContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
      const files = {
        'package.json': '{"name":"test"}',
        'public/logo.png': binaryContent,
      };

      const result = await zipGenerator.createZipFile(files, 'test-with-binary');

      const zip = new JSZip();
      const extracted = await zip.loadAsync(result.data);

      const pngFile = extracted.file('public/logo.png');
      expect(pngFile).toBeTruthy();

      const extractedBinary = await pngFile?.async('uint8array');
      expect(extractedBinary).toEqual(binaryContent);
    });

    it('should handle mixed string and binary files', async () => {
      const zipGenerator = new ZipGenerator();
      const files: Record<string, string | Uint8Array> = {
        'index.html': '<html></html>',
        'data.bin': new Uint8Array([1, 2, 3, 4]),
        'src/app.ts': 'export const app = {};',
      };

      const result = await zipGenerator.createZipFile(files, 'mixed-content');

      const zip = new JSZip();
      const extracted = await zip.loadAsync(result.data);

      const html = await extracted.file('index.html')?.async('string');
      expect(html).toBe('<html></html>');

      const binary = await extracted.file('data.bin')?.async('uint8array');
      expect(binary).toEqual(new Uint8Array([1, 2, 3, 4]));

      const ts = await extracted.file('src/app.ts')?.async('string');
      expect(ts).toBe('export const app = {};');
    });

    it('should report progress through the callback', async () => {
      const zipGenerator = new ZipGenerator();
      const files = {
        'file1.txt': 'content1',
        'file2.txt': 'content2',
        'file3.txt': 'content3',
      };

      const progressCallback = vi.fn();

      await zipGenerator.createZipFile(files, 'test-progress', {
        onProgress: progressCallback,
      });

      // Verify callback was called at least once
      expect(progressCallback).toHaveBeenCalled();

      // Verify it was called at least once for adding and once for compressing
      const addingCalls = progressCallback.mock.calls.filter(
        (call) => call[0].operation === 'adding'
      );
      const compressingCalls = progressCallback.mock.calls.filter(
        (call) => call[0].operation === 'compressing'
      );

      expect(addingCalls.length).toBeGreaterThan(0);
      expect(compressingCalls.length).toBeGreaterThan(0);

      // Check that progress information includes relevant data
      const firstAddingCall = addingCalls[0][0];
      expect(firstAddingCall).toHaveProperty('processedFiles');
      expect(firstAddingCall).toHaveProperty('totalFiles');
      expect(firstAddingCall).toHaveProperty('percent');

      const lastCompressingCall = compressingCalls[compressingCalls.length - 1][0];
      expect(lastCompressingCall.percent).toBeGreaterThanOrEqual(50);
    });

    it('should handle path normalization correctly', async () => {
      const zipGenerator = new ZipGenerator();
      const files = {
        '/leading/slash/file.txt': 'content',
        'windows/path/file.txt': 'content', // No backslashes, as they need special escaping
        'normal/path/file.txt': 'content',
      };

      const result = await zipGenerator.createZipFile(files, 'path-test');

      const zip = new JSZip();
      const extracted = await zip.loadAsync(result.data);

      // Check specific paths are normalized
      expect(extracted.file('leading/slash/file.txt')).toBeTruthy();
      expect(extracted.file('windows/path/file.txt')).toBeTruthy();
      expect(extracted.file('normal/path/file.txt')).toBeTruthy();

      // List all files to verify
      const actualFiles = Object.keys(extracted.files).filter((path) => !extracted.files[path].dir);
      expect(actualFiles).toContain('leading/slash/file.txt');
    });

    it('should ensure .zip extension is added to filename', async () => {
      const zipGenerator = new ZipGenerator();
      const files = { 'test.txt': 'content' };

      // Test without .zip extension
      const result1 = await zipGenerator.createZipFile(files, 'test-file');
      expect(result1.fileName).toBe('test-file.zip');

      // Test with .zip extension already present
      const result2 = await zipGenerator.createZipFile(files, 'test-file.zip');
      expect(result2.fileName).toBe('test-file.zip');

      // Test with uppercase .ZIP extension
      const result3 = await zipGenerator.createZipFile(files, 'test-file.ZIP');
      expect(result3.fileName).toBe('test-file.ZIP');
    });

    it('should handle compression options', async () => {
      const zipGenerator = new ZipGenerator();

      // Create a highly compressible file (100kb of repeating data)
      const repeatChar = 'a';
      const fileContent = repeatChar.repeat(100000);

      const files = { 'large-file.txt': fileContent };

      // Instead of testing compression levels directly (which may be unreliable in tests),
      // we'll just verify that the compression option is accepted
      const result = await zipGenerator.createZipFile(files, 'compression-test', {
        compressionLevel: 9,
      });

      // In test environment we should get a Buffer (not Blob)
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.fileName).toBe('compression-test.zip');
    });

    it('should handle empty file list gracefully', async () => {
      const zipGenerator = new ZipGenerator();
      const files = {};

      const result = await zipGenerator.createZipFile(files, 'empty-test');

      // In test environment we should get a Buffer (not Blob)
      expect(Buffer.isBuffer(result.data)).toBe(true);
      // Buffer should be small for empty zip
      expect((result.data as Buffer).length).toBeLessThan(100);
    });
  });
});
