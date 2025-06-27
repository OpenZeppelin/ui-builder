import { beforeEach, describe, expect, it } from 'vitest';

// Import StyleManager AFTER potential (now removed) mocks
import { StyleManager } from '../StyleManager';

describe('StyleManager', () => {
  let styleManager: StyleManager;

  beforeEach(() => {
    // Create a new instance before each test
    styleManager = new StyleManager();
  });

  describe('getStyleFiles', () => {
    it('should return an array of CSS file objects with correct paths and content', () => {
      const styleFiles = styleManager.getStyleFiles();

      expect(styleFiles).toBeInstanceOf(Array);
      expect(styleFiles).toHaveLength(2);

      // Check global.css - align with mock in vitest.config.ts
      const globalCss = styleFiles.find((f) => f.path === 'src/styles/global.css');
      expect(globalCss).toBeDefined();
      expect(globalCss?.content).toBe('/* Mock Global CSS */');

      // Check template styles.css - align with mock
      const templateStylesCss = styleFiles.find((f) => f.path === 'src/styles.css');
      expect(templateStylesCss).toBeDefined();
      expect(templateStylesCss?.content).toBe('/* Mock Template styles.css */');
    });
  });

  describe('getConfigFiles', () => {
    it('should return an array of config file objects with correct paths and content', () => {
      const configFiles = styleManager.getConfigFiles();

      expect(configFiles).toBeInstanceOf(Array);
      expect(configFiles).toHaveLength(2); // tailwind, components

      // Check tailwind.config.cjs - align with mock string
      const tailwindConfig = configFiles.find((f) => f.path === 'tailwind.config.cjs');
      expect(tailwindConfig).toBeDefined();
      expect(tailwindConfig?.content).toBe('{/* Mock Tailwind */}');

      // Check components.json - align with mock string
      const componentsJson = configFiles.find((f) => f.path === 'components.json');
      expect(componentsJson).toBeDefined();
      expect(componentsJson?.content).toBe('{ "mock": true }');
    });
  });
});
