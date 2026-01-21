import type { Ecosystem, EcosystemFeatureConfig } from '@openzeppelin/ui-types';
import { appConfigService } from '@openzeppelin/ui-utils';

import {
  getAvailableEcosystems,
  getEcosystemDefaultFeatureConfig,
} from '../core/ecosystems/registry';

/**
 * Gets the feature configuration for a specific ecosystem
 * Uses feature flags to override default behavior
 */
export function getEcosystemFeatureConfig(ecosystem: Ecosystem): EcosystemFeatureConfig {
  const defaultConfig = getEcosystemDefaultFeatureConfig(ecosystem);

  // Check for feature flag overrides
  const enabledFlag = `ecosystem_${ecosystem}_enabled`;

  // For enabled flag, use OR logic: default OR feature flag
  const enabled = defaultConfig.enabled || appConfigService.isFeatureEnabled(enabledFlag);

  // For showInUI flag, default to true but allow explicit override
  // If the feature flag is explicitly set, use it; otherwise use the default
  // We assume a feature flag was explicitly set if it exists in the environment
  // Since we can't distinguish between "not set" and "set to false" in this context,
  // we default to the configured value (true for all ecosystems by default)
  let showInUI = defaultConfig.showInUI;

  // Only override if the feature flag is explicitly enabled (for positive logic)
  // If someone wants to hide an ecosystem, they should use the hide flag
  const hideInUIFlag = `ecosystem_${ecosystem}_hide_in_ui`;
  if (appConfigService.isFeatureEnabled(hideInUIFlag)) {
    showInUI = false;
  }

  return {
    enabled,
    showInUI,
    disabledLabel: defaultConfig.disabledLabel,
    disabledDescription: defaultConfig.disabledDescription,
  };
}

/**
 * Checks if an ecosystem is enabled and functional
 */
export function isEcosystemEnabled(ecosystem: Ecosystem): boolean {
  return getEcosystemFeatureConfig(ecosystem).enabled;
}

/**
 * Checks if an ecosystem should be shown in the UI
 */
export function shouldShowEcosystemInUI(ecosystem: Ecosystem): boolean {
  return getEcosystemFeatureConfig(ecosystem).showInUI;
}

/**
 * Gets all ecosystems that should be displayed in the UI
 */
export function getVisibleEcosystems(): Ecosystem[] {
  return getAvailableEcosystems().filter(shouldShowEcosystemInUI);
}

/**
 * Gets all enabled ecosystems
 */
export function getEnabledEcosystems(): Ecosystem[] {
  return getAvailableEcosystems().filter(isEcosystemEnabled);
}
