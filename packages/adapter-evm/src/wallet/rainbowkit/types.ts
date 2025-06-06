/**
 * Custom RainbowKit configuration types for enhanced UI control
 */
/**
 * Re-export RainbowKit's native types for ConnectButton props
 * This ensures we use the exact same types that RainbowKit expects,
 * reducing maintenance burden and letting RainbowKit handle type validation
 */
// Import RainbowKit's native ConnectButton types
import type { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Extract the props type from RainbowKit's ConnectButton component
 * This gives us the exact same types that RainbowKit uses internally
 */
export type RainbowKitConnectButtonProps = React.ComponentProps<typeof ConnectButton>;

/**
 * Custom UI configuration that uses RainbowKit's native types
 * This extends our configuration system while leveraging RainbowKit's own type definitions
 */
export interface RainbowKitCustomizations {
  /**
   * Configuration for the RainbowKit ConnectButton component
   * Uses RainbowKit's native prop types for type safety and compatibility
   */
  connectButton?: Partial<RainbowKitConnectButtonProps>;
}

/**
 * Type guard to check if an object contains RainbowKit customizations
 */
export function isRainbowKitCustomizations(obj: unknown): obj is RainbowKitCustomizations {
  return typeof obj === 'object' && obj !== null && 'connectButton' in obj;
}

/**
 * Utility to extract RainbowKit customizations from a kit config
 */
export function extractRainbowKitCustomizations(
  kitConfig: Record<string, unknown> | undefined
): RainbowKitCustomizations | undefined {
  if (!kitConfig || !kitConfig.customizations) {
    return undefined;
  }

  const customizations = kitConfig.customizations;
  return isRainbowKitCustomizations(customizations) ? customizations : undefined;
}
