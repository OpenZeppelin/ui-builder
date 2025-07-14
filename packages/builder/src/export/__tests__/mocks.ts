/**
 * FormRendererConfig interface mirrors the structure from form-renderer package.
 */
interface FormRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

/**
 * Mock form renderer configuration that defines dependencies for specific field types.
 */
export const mockFormRendererConfig: FormRendererConfig = {
  coreDependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  },
  fieldDependencies: {
    text: { runtimeDependencies: {} },
    date: {
      runtimeDependencies: { 'react-datepicker': '^4.14.0' },
      devDependencies: { '@types/react-datepicker': '^4.11.2' },
    },
  },
};
