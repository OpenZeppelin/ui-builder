import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateManager } from '../TemplateManager';

// Mock file contents
const mockTemplateContent = {
  'package.json': JSON.stringify(
    {
      name: 'transaction-form',
      private: true,
      version: '0.0.0',
      type: 'module',
    },
    null,
    2
  ),
  'index.html': '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
  'src/components/FormPlaceholder.tsx':
    'export function FormPlaceholder() { return <div>Placeholder</div>; }',
  'src/components/App.tsx': 'export function App() { return <div>App</div>; }',
  'src/adapters/AdapterPlaceholder.ts': 'export class AdapterPlaceholder {}',
  'src/main.tsx': 'import React from "react"; import ReactDOM from "react-dom/client";',
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
      expect(files).toHaveProperty('src/components/FormPlaceholder.tsx');
      expect(files).toHaveProperty('src/components/App.tsx');
      expect(files).toHaveProperty('src/adapters/AdapterPlaceholder.ts');
      expect(files).toHaveProperty('src/main.tsx');
    });

    it('should throw an error for an invalid template', async () => {
      await expect(templateManager.getTemplateFiles('invalid-template')).rejects.toThrow(
        'Template "invalid-template" not found'
      );
    });
  });

  describe('createProject', () => {
    it('should create a project with template files and custom files', async () => {
      const customFiles = {
        'src/components/GeneratedForm.tsx':
          'export function GeneratedForm() { return <div>Generated</div>; }',
      };

      const projectFiles = await templateManager.createProject(
        'typescript-react-vite',
        customFiles
      );

      // Check if template files are present
      expect(projectFiles).toHaveProperty('package.json');
      expect(projectFiles).toHaveProperty('index.html');
      // Check if custom files are present
      expect(projectFiles).toHaveProperty('src/components/GeneratedForm.tsx');
      // Check if FormPlaceholder.tsx was removed (as it should be replaced by GeneratedForm.tsx)
      expect(projectFiles).not.toHaveProperty('src/components/FormPlaceholder.tsx');
    });

    it('should apply template options', async () => {
      const options = {
        projectName: 'custom-project-name',
        description: 'Custom description',
      };

      const projectFiles = await templateManager.createProject(
        'typescript-react-vite',
        {},
        options
      );

      // Check if package.json was updated with custom project name
      const packageJson = JSON.parse(projectFiles['package.json']);
      expect(packageJson.name).toBe('custom-project-name');
    });
  });
});
