import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateManager } from '../TemplateManager';

// Mock file contents
const mockTemplateContent = {
  'package.json': JSON.stringify(
    {
      name: 'contracts-ui-builder',
      private: true,
      version: '0.0.0',
      type: 'module',
    },
    null,
    2
  ),
  'index.html': '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
  'src/App.tsx': 'export function App() { return <div>App</div>; }',
  'src/components/GeneratedForm.tsx':
    'export function GeneratedForm() { return <div>Placeholder Content</div>; }',
  // 'src/adapters/AdapterPlaceholder.ts': 'export class AdapterPlaceholder {}', // Keep commented if not used in test
  'src/main.tsx': '// Base main.tsx placeholder content',
};

// Create a module-scoped templateManager instance that tests will use
let templateManager: TemplateManager;

describe('TemplateManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Create a new TemplateManager instance for each test
    templateManager = new TemplateManager();

    // This is a bit of a hack, but we're directly manipulating the private templates field
    // to inject our mock data since we can't override the glob import properly
    const templateRegistry = {
      'typescript-react-vite': { ...mockTemplateContent },
    };

    // @ts-expect-error - accessing private property
    templateManager.templates = templateRegistry;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvailableTemplates', () => {
    it('should return the available template names', async () => {
      const templates = await templateManager.getAvailableTemplates();
      expect(templates).toContain('typescript-react-vite');
    });
  });

  describe('getTemplateFiles', () => {
    it('should return template files for a valid template', async () => {
      const files = await templateManager.getTemplateFiles('typescript-react-vite');

      // Check if expected files are present
      expect(files).toHaveProperty('package.json');
      expect(files).toHaveProperty('index.html');
      expect(files).toHaveProperty('src/App.tsx');
      // Check for the renamed placeholder
      expect(files).toHaveProperty('src/components/GeneratedForm.tsx');
      // expect(files).toHaveProperty('src/adapters/AdapterPlaceholder.ts'); // Keep commented if not used
      expect(files).toHaveProperty('src/main.tsx');
      // Verify placeholder content
      expect(files['src/components/GeneratedForm.tsx']).toContain('Placeholder Content');
    });

    it('should throw an error for an invalid template', async () => {
      await expect(templateManager.getTemplateFiles('invalid-template')).rejects.toThrow(
        'Template "invalid-template" not found'
      );
    });
  });

  describe('createProject', () => {
    it('should overwrite placeholder files with custom files', async () => {
      const customGeneratedFormContent =
        'export default function GeneratedForm() { return <div>Actual Generated Content</div>; }';
      const customFiles = {
        'src/components/GeneratedForm.tsx': customGeneratedFormContent,
        'src/App.tsx': '// Generated App.tsx content', // Example overwrite for App
      };

      const projectFiles = await templateManager.createProject(
        'typescript-react-vite',
        customFiles
      );

      // Check if template files are present (except those overwritten)
      expect(projectFiles).toHaveProperty('package.json');
      expect(projectFiles).toHaveProperty('index.html');
      expect(projectFiles).toHaveProperty('src/main.tsx');

      // Check if custom files have overwritten the placeholders
      expect(projectFiles['src/components/GeneratedForm.tsx']).toBe(customGeneratedFormContent);
      expect(projectFiles['src/App.tsx']).toBe('// Generated App.tsx content');

      // Ensure other placeholders (if any were defined and not overwritten) are still there
      // expect(projectFiles).toHaveProperty('src/adapters/AdapterPlaceholder.ts'); // Example if needed
    });

    it('should apply template options', async () => {
      const options = {
        projectName: 'custom-project-name',
        description: 'Custom description',
      };

      const projectFiles = await templateManager.createProject(
        'typescript-react-vite',
        {}, // No custom files for this test
        options
      );

      // Check if package.json was updated with custom project name
      const packageJson = JSON.parse(projectFiles['package.json']);
      expect(packageJson.name).toBe('custom-project-name');
    });
  });
});
