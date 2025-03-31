// packages/core/src/export/__tests__/StyleManager.test.ts
import { beforeEach, describe, expect, it } from 'vitest';

// --- Remove Mock Virtual Modules ---
// Mocks are now provided globally by the plugin in vitest.config.ts
// vi.mock('virtual:global-css-content', ...);
// vi.mock('virtual:data-slots-css-content', ...);
// vi.mock('virtual:template-vite-styles-css-content', ...);
// vi.mock('virtual:tailwind-config-content', ...);
// vi.mock('virtual:postcss-config-content', ...);
// vi.mock('virtual:components-json-content', ...);
// --- End Remove Mock Virtual Modules ---
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
      expect(styleFiles).toHaveLength(3); // global, data-slots, template styles.css

      // Check global.css - align with mock in vitest.config.ts
      const globalCss = styleFiles.find((f) => f.path === 'src/styles/global.css');
      expect(globalCss).toBeDefined();
      expect(globalCss?.content).toBe('/* Mock Global CSS */');

      // Check data-slots.css - align with mock
      const dataSlotsCss = styleFiles.find(
        (f) => f.path === 'src/styles/utils/auto-generated-data-slots.css'
      );
      expect(dataSlotsCss).toBeDefined();
      expect(dataSlotsCss?.content).toBe('/* Mock Data Slots CSS */');

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
      expect(configFiles).toHaveLength(3); // tailwind, postcss, components

      // Check tailwind.config.cjs - align with mock string
      const tailwindConfig = configFiles.find((f) => f.path === 'tailwind.config.cjs');
      expect(tailwindConfig).toBeDefined();
      expect(tailwindConfig?.content).toBe('{/* Mock Tailwind */}');

      // Check postcss.config.cjs - align with mock string
      const postcssConfig = configFiles.find((f) => f.path === 'postcss.config.cjs');
      expect(postcssConfig).toBeDefined();
      expect(postcssConfig?.content).toBe('{/* Mock PostCSS */}');

      // Check components.json - align with mock string
      const componentsJson = configFiles.find((f) => f.path === 'components.json');
      expect(componentsJson).toBeDefined();
      expect(componentsJson?.content).toBe('{ "mock": true }');
    });
  });
});
