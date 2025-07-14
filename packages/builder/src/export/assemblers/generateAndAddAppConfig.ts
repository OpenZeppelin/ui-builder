import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import type {
  GlobalServiceConfigs,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import type { TemplateProcessor } from '../generators/TemplateProcessor';

const LOG_SYSTEM_MAIN = 'File Assembly (generateAndAddAppConfig)';

function _generateExplorerApiConfigSection(
  networkConfig: NetworkConfig,
  logSystem: string
): {
  configSection: Record<string, { apiKey: string; _comment?: string }>;
  overallNote: string;
  specificNote: string;
} {
  let configSection: Record<string, { apiKey: string; _comment?: string }> = {};
  let overallNote =
    'No specific block explorer API key is strictly required for the default functionality of this exported form, as the contract ABI is pre-loaded. However, you can configure one here if you plan to extend this application to dynamically fetch ABIs for other contracts on this network, or for future features.';
  let specificNote = '';

  if (networkConfig.primaryExplorerApiIdentifier) {
    const serviceId = networkConfig.primaryExplorerApiIdentifier;
    const apiKeyPlaceholder = `YOUR_${serviceId.toUpperCase().replace(/-/g, '_')}_API_KEY_HERE`;
    configSection[serviceId] = {
      apiKey: apiKeyPlaceholder,
      _comment: `API key for the ${serviceId} block explorer. Used if the app dynamically loads new contract ABIs.`,
    };
    specificNote = `The entry for '${serviceId}' is for the primary block explorer relevant to the network this form was exported for (${networkConfig.name}).`;
  } else {
    const genericId = `CONFIGURE_EXPLORER_API_KEY_FOR_${networkConfig.id.toUpperCase().replace(/-/g, '_')}`;
    configSection[genericId] = {
      apiKey: `YOUR_API_KEY_FOR_${networkConfig.name}_EXPLORER`,
      _comment: `API key for the block explorer for ${networkConfig.name}. Update the key name to a specific service identifier if known, or define 'primaryExplorerApiIdentifier' on its NetworkConfig in the builder app.`,
    };
    specificNote = `This network type (${networkConfig.ecosystem}) does not have a pre-defined primaryExplorerApiIdentifier. Update the generic placeholder if using dynamic ABI loading.`;
    logger.warn(
      logSystem,
      `No primaryExplorerApiIdentifier for network ${networkConfig.id}. Using generic placeholder for explorer API key.`
    );
  }
  return { configSection, overallNote, specificNote };
}

function _generateRpcEndpointsConfigSection(
  networkConfig: NetworkConfig
): Record<string, string | { http: string; _comment?: string }> {
  const rpcConfig: Record<string, string | { http: string; _comment?: string }> = {};
  const rpcNetworkIdKey = networkConfig.id;
  rpcConfig[rpcNetworkIdKey] =
    `YOUR_${rpcNetworkIdKey.toUpperCase().replace(/-/g, '_')}_RPC_URL_HERE_IF_NEEDED`;
  rpcConfig[`_comment_for_${rpcNetworkIdKey}`] =
    `Optional: Provide a custom RPC URL for the ${networkConfig.name} network. If omitted, a default public RPC will be used.`;
  return rpcConfig;
}

function _buildWalletUiServiceConfig(uiKitConfig?: UiKitConfiguration): {
  config: { kitName?: string };
  _comment: string;
} {
  return {
    config: {
      kitName: uiKitConfig?.kitName || 'custom',
    },
    _comment:
      "Defines the UI kit to use. E.g., 'custom', 'rainbowkit', or 'none'. The exported app will load the corresponding config from src/config/wallet/[kitName].config.ts.",
  };
}

function _generateGlobalServiceConfigPlaceholders(
  uiKitConfig?: UiKitConfiguration
): GlobalServiceConfigs {
  return {
    walletui: _buildWalletUiServiceConfig(uiKitConfig),
    walletconnect: {
      projectId: 'YOUR_WALLETCONNECT_PROJECT_ID_HERE',
      _comment: 'WalletConnect Project ID, required if you intend to use WalletConnect.',
    },
  };
}

/**
 * Generates the content for public/app.config.json in the exported project,
 * tailoring it to the specific network the form was exported for.
 */
export async function generateAndAddAppConfig(
  projectFiles: Record<string, string>,
  networkConfig: NetworkConfig,
  templateProcessor: TemplateProcessor,
  formConfig: BuilderFormConfig
): Promise<void> {
  const appConfigExamplePath = 'public/app.config.json.example';
  const logSystem = LOG_SYSTEM_MAIN;
  const uiKitConfig = formConfig.uiKitConfig;

  const explorerInfo = _generateExplorerApiConfigSection(networkConfig, logSystem);
  const rpcEndpointsConfig = _generateRpcEndpointsConfigSection(networkConfig);
  const globalServicePlaceholders = _generateGlobalServiceConfigPlaceholders(uiKitConfig);

  const appConfigContent = {
    _readme: [
      "This is an example configuration file. To use it, rename this file to 'app.config.json' in the 'public' directory.",
      'Then, fill in your actual API keys, WalletConnect Project ID, and custom RPC URLs as needed.',
      'The baked-in defaults for this exported form will be used if this file is not renamed or if specific settings are omitted.',
      explorerInfo.specificNote,
      'API keys and other sensitive information should be managed securely.',
    ],
    networkServiceConfigs: {
      _comment: explorerInfo.overallNote.trim(),
      ...explorerInfo.configSection,
    },
    globalServiceConfigs: globalServicePlaceholders,
    rpcEndpoints: rpcEndpointsConfig,
    featureFlags: {
      exampleFeatureInExportedApp: true,
    },
    defaultLanguage: 'en',
  };

  try {
    projectFiles[appConfigExamplePath] = await templateProcessor.formatJson(
      JSON.stringify(appConfigContent, null, 2)
    );
    logger.info(logSystem, `Generated and added ${appConfigExamplePath}.`);

    if (uiKitConfig && uiKitConfig.kitName && !['custom', 'none'].includes(uiKitConfig.kitName)) {
      const activeAppConfigPath = 'public/app.config.json';
      const activeAppConfigContent = {
        globalServiceConfigs: {
          walletui: {
            config: {
              kitName: uiKitConfig.kitName,
            },
          },
        },
      };
      projectFiles[activeAppConfigPath] = await templateProcessor.formatJson(
        JSON.stringify(activeAppConfigContent, null, 2)
      );
      logger.info(logSystem, `Generated active ${activeAppConfigPath} for selected UI kit.`);
    }
  } catch (formattingError) {
    logger.warn(
      logSystem,
      `Failed to format generated config files, using raw string.`,
      formattingError
    );
    projectFiles[appConfigExamplePath] = JSON.stringify(appConfigContent, null, 2);
  }
}
