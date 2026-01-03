import type { EcosystemWalletComponents, UiKitConfiguration } from '@openzeppelin/ui-types';
import { ECOSYSTEM_WALLET_COMPONENT_KEYS } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

/**
 * Filters a set of wallet components based on an exclusion list.
 *
 * @param allPossibleComponents - An object containing all potential components for a kit.
 * @param exclusions - An array of component keys to exclude.
 * @param kitName - The name of the kit being filtered (for logging purposes).
 * @returns The filtered EcosystemWalletComponents object, or undefined if all components are excluded.
 */
export function filterWalletComponents(
  allPossibleComponents: EcosystemWalletComponents,
  exclusions: Array<keyof EcosystemWalletComponents>,
  kitName: string = 'custom' // Default to custom for logging context
): EcosystemWalletComponents | undefined {
  logger.debug(
    'filterWalletComponents',
    `Filtering components for kit: ${kitName}. Exclusions: ${exclusions.join(', ')}.`
  );
  if (!allPossibleComponents || Object.keys(allPossibleComponents).length === 0) {
    logger.debug('filterWalletComponents', `No components provided to filter for kit: ${kitName}.`);
    return undefined;
  }

  if (exclusions.length === 0) {
    logger.debug(
      'filterWalletComponents',
      `Providing all components for kit: ${kitName}.`,
      allPossibleComponents
    );
    return allPossibleComponents;
  }

  const filteredComponents: Partial<EcosystemWalletComponents> = {};
  let componentCount = 0;
  for (const key in allPossibleComponents) {
    const componentKey = key as keyof EcosystemWalletComponents;
    if (!exclusions.includes(componentKey)) {
      if (allPossibleComponents[componentKey]) {
        // Ensure the component actually exists before adding
        filteredComponents[componentKey] = allPossibleComponents[componentKey];
        componentCount++;
      }
    }
  }

  if (componentCount > 0) {
    logger.debug(
      'filterWalletComponents',
      `Providing filtered components for kit: ${kitName} after exclusions (${exclusions.join(', ')}).`,
      filteredComponents
    );
    return filteredComponents as EcosystemWalletComponents;
  }

  logger.debug('filterWalletComponents', `All components were excluded for kit: ${kitName}.`);
  return undefined;
}

/**
 * Extracts the component exclusion list from a UI kit configuration object.
 *
 * @param kitConfig - The `kitConfig` object from `UiKitConfiguration`.
 * @returns An array of component keys to exclude, or an empty array if none are specified or config is invalid.
 */
export function getComponentExclusionsFromConfig(
  kitConfig: UiKitConfiguration['kitConfig']
): Array<keyof EcosystemWalletComponents> {
  if (kitConfig && typeof kitConfig === 'object' && 'components' in kitConfig) {
    const componentsCfg = kitConfig.components;
    if (
      componentsCfg &&
      typeof componentsCfg === 'object' &&
      'exclude' in componentsCfg &&
      Array.isArray(componentsCfg.exclude)
    ) {
      // Ensure all elements are valid keys of EcosystemWalletComponents
      // This provides a bit more type safety at runtime if the config comes from an untyped source
      return componentsCfg.exclude.filter(
        (key): key is keyof EcosystemWalletComponents =>
          typeof key === 'string' &&
          (ECOSYSTEM_WALLET_COMPONENT_KEYS as readonly string[]).includes(key)
      ) as Array<keyof EcosystemWalletComponents>;
    }
  }
  return [];
}
