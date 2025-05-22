import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

/**
 * RainbowKit configuration options definition
 */
export interface RainbowKitConfig {
  /**
   * The name of your application. This will be displayed in the RainbowKit UI.
   */
  appName: string;

  /**
   * WalletConnect Cloud Project ID. Required for WalletConnect v2 functionality.
   * Obtain from https://cloud.walletconnect.com/
   */
  projectId: string;

  /**
   * Theme options for RainbowKit. Can be used with darkTheme() or lightTheme() functions.
   * The structure of this object should match what RainbowKit's theme functions expect.
   * Example: `{ accentColor: '#FF007A', borderRadius: 'small' }`
   */
  themeOptions?: Record<string, unknown>;

  /**
   * Optional theme name to apply. Defaults to dark theme if themeOptions are provided but no name.
   * If themeOptions are not provided, no specific theme is applied by default (RainbowKit default).
   */
  themeName?: 'light' | 'dark';

  /**
   * Initial chain to connect to. Should be one of the chains supported by the adapter.
   */
  initialChain?: number;

  /**
   * Whether to enable server-side rendering support.
   */
  ssr?: boolean;

  /**
   * Modal size configuration.
   */
  modalSize?: 'compact' | 'wide';

  /**
   * Configuration for including/excluding specific adapter-provided UI components.
   */
  components?: {
    exclude?: string[];
  };
}

/**
 * Helper type for dynamic imports of RainbowKit components
 * Using any for component types to avoid TypeScript errors with dynamic imports
 */
export interface RainbowKitImports {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RainbowKitProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDefaultConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  darkTheme?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lightTheme?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ConnectButton: any;
}

/**
 * Try to dynamically import the RainbowKit package and required components.
 *
 * @returns Promise resolving to the imported components or null if import fails
 */
export async function tryImportRainbowKit(): Promise<RainbowKitImports | null> {
  try {
    // Dynamic import of RainbowKit components
    const { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme, ConnectButton } =
      await import('@rainbow-me/rainbowkit');

    logger.info('rainbowkit/utils', 'Successfully imported RainbowKit components');

    return {
      RainbowKitProvider,
      getDefaultConfig,
      darkTheme,
      lightTheme,
      ConnectButton,
    };
  } catch (error) {
    logger.error('rainbowkit/utils', 'Failed to import RainbowKit components:', error);
    return null;
  }
}

/**
 * Validates the RainbowKit configuration to ensure required fields are present.
 *
 * @param kitConfig - The RainbowKit configuration object
 * @returns Object containing the validation result and any missing fields or error message
 */
export function validateRainbowKitConfig(kitConfig?: UiKitConfiguration['kitConfig']): {
  isValid: boolean;
  missingFields?: string[];
  error?: string;
} {
  if (!kitConfig) {
    return { isValid: false, error: 'No kitConfig provided for RainbowKit' };
  }

  const missingFields: string[] = [];

  // Check if kitConfig is a RainbowKitConfig by checking for required fields
  if (!('appName' in kitConfig)) {
    missingFields.push('appName');
  }

  if (!('projectId' in kitConfig)) {
    missingFields.push('projectId');
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      error: `Missing or invalid required fields for RainbowKit configuration: ${missingFields.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Extracts and type-guards a RainbowKit configuration from a UiKitConfiguration
 *
 * @param config The UI kit configuration
 * @returns The RainbowKit configuration or undefined if invalid or not RainbowKit
 */
export function getRainbowKitConfig(config: UiKitConfiguration): RainbowKitConfig | undefined {
  if (config.kitName !== 'rainbowkit' || !config.kitConfig) {
    return undefined;
  }

  const rawKitConfig = config.kitConfig; // This is UiKitConfiguration['kitConfig']

  const validation = validateRainbowKitConfig(rawKitConfig);
  if (!validation.isValid) {
    // Log the validation error for better debugging if needed
    logger.warn('rainbowkit/utils', `RainbowKit config validation failed: ${validation.error}`);
    return undefined;
  }

  // Now that validation has passed, we know appName and projectId are strings.
  const result: RainbowKitConfig = {
    appName: rawKitConfig.appName as string,
    projectId: rawKitConfig.projectId as string,
  };

  // Copy optional properties if present and of expected type
  if (rawKitConfig.themeOptions && typeof rawKitConfig.themeOptions === 'object') {
    result.themeOptions = rawKitConfig.themeOptions as Record<string, unknown>;
  }

  if (
    rawKitConfig.themeName &&
    (rawKitConfig.themeName === 'light' || rawKitConfig.themeName === 'dark')
  ) {
    result.themeName = rawKitConfig.themeName as 'light' | 'dark';
  }

  if (typeof rawKitConfig.initialChain === 'number') {
    result.initialChain = rawKitConfig.initialChain;
  }

  if (typeof rawKitConfig.ssr === 'boolean') {
    result.ssr = rawKitConfig.ssr;
  }

  if (rawKitConfig.modalSize === 'compact' || rawKitConfig.modalSize === 'wide') {
    result.modalSize = rawKitConfig.modalSize as 'compact' | 'wide';
  }

  // Handle components.exclude carefully as components itself is optional in kitConfig
  const componentsConfig = rawKitConfig.components;
  if (componentsConfig && typeof componentsConfig === 'object' && componentsConfig.exclude) {
    const excludeArray = componentsConfig.exclude;
    if (Array.isArray(excludeArray)) {
      result.components = {
        exclude: excludeArray.filter((item) => typeof item === 'string'),
      };
    }
  }

  return result;
}
