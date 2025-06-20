/**
 * @fileoverview Rule to enforce that adapter classes only implement methods defined in the ContractAdapter interface
 * @author Transaction Form Builder Team
 *
 * IMPORTANT: This is the central location for this rule in the monorepo.
 * It is referenced from both the root ESLint configuration and the core package configuration.
 * Do not duplicate this rule in package-specific directories.
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce that adapter classes only implement methods defined in the ContractAdapter interface',
      category: 'TypeScript',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      extraMethod: "Method '{{method}}' is not defined in the ContractAdapter interface.",
      extraPrivateMethod:
        "Private method '{{method}}' should be marked with the 'private' keyword.",
    },
  },

  create(context) {
    // Known interface methods from ContractAdapter
    const interfaceMethods = [
      'loadContract',
      'getWritableFunctions',
      'mapParameterTypeToFieldType',
      'getCompatibleFieldTypes',
      'generateDefaultField',
      'formatTransactionData',
      'signAndBroadcast',
      'isValidAddress',
      'getSupportedExecutionMethods',
      'validateExecutionConfig',
      'isViewFunction',
      'queryViewFunction',
      'formatFunctionResult',
      'supportsWalletConnection',
      'getAvailableConnectors',
      'connectWallet',
      'disconnectWallet',
      'getWalletConnectionStatus',
      'onWalletConnectionChange',
      'getExplorerUrl',
      'getExplorerTxUrl',
      'waitForTransactionConfirmation',
      'configureUiKit',
      'getEcosystemReactUiContextProvider',
      'getEcosystemReactHooks',
      'getEcosystemWalletComponents',
      'getAvailableUiKits',
    ];

    // Common standard methods and properties that are allowed
    const allowedMethods = ['constructor', 'toString', 'toJSON', 'valueOf'];

    return {
      ClassDeclaration(node) {
        // Only check classes that implement ContractAdapter
        if (
          node.implements &&
          node.implements.some(
            (impl) => impl.expression && impl.expression.name === 'ContractAdapter'
          )
        ) {
          node.body.body.forEach((member) => {
            if (member.type === 'MethodDefinition') {
              const methodName = member.key.name;

              // Skip if it's an allowed method or in the interface
              if (allowedMethods.includes(methodName) || interfaceMethods.includes(methodName)) {
                return;
              }

              // Allow private methods, but they should be marked with private
              if (methodName.startsWith('_')) {
                if (!member.accessibility || member.accessibility !== 'private') {
                  context.report({
                    node: member,
                    messageId: 'extraPrivateMethod',
                    data: {
                      method: methodName,
                    },
                  });
                }
                return;
              }

              // Report methods not in the interface and not marked as private
              if (!member.accessibility || member.accessibility !== 'private') {
                context.report({
                  node: member,
                  messageId: 'extraMethod',
                  data: {
                    method: methodName,
                  },
                });
              }
            }
          });
        }
      },
    };
  },
};
